#!/usr/bin/env python3
"""StreamSound 远程助手：用 SSH 管理 Ubuntu 上的服务端。

配置默认读取 tools/deploy.env（可用 STREAMSOUND_DEPLOY_ENV 覆盖）。
用法：
  python tools/remote.py info
  python tools/remote.py run "systemctl is-active streamsound"
  python tools/remote.py sudo "systemctl restart streamsound"
  python tools/remote.py upload <本地路径> <远程路径>
"""

from __future__ import annotations

import argparse
import os
import posixpath
import stat
import sys
from pathlib import Path

DEFAULT_ENV = Path(__file__).resolve().parent / "deploy.env"


def load_config(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key.strip()] = value
    return values


def connect(config: dict[str, str]):
    try:
        import paramiko
    except ImportError:
        sys.exit("缺少 paramiko：请先运行 python -m pip install paramiko")

    host = config.get("STREAMSOUND_SSH_HOST", "")
    port = int(config.get("STREAMSOUND_SSH_PORT") or 22)
    user = config.get("STREAMSOUND_SSH_USER", "")
    password = config.get("STREAMSOUND_SSH_PASSWORD") or None
    key = config.get("STREAMSOUND_SSH_KEY") or None

    if not host or not user:
        sys.exit("缺少 STREAMSOUND_SSH_HOST / STREAMSOUND_SSH_USER：请参考 tools/deploy.env.example 填写 tools/deploy.env")

    client = paramiko.SSHClient()
    client.load_system_host_keys()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=host,
        port=port,
        username=user,
        password=password,
        key_filename=key,
        timeout=15,
        banner_timeout=20,
        auth_timeout=20,
        look_for_keys=not password and not key,
        allow_agent=not password and not key,
    )
    return client


def run(client, command: str, password: str | None = None, sudo: bool = False) -> int:
    if sudo:
        command = f"sudo -S -p '' {command}"
    stdin, stdout, stderr = client.exec_command(command, get_pty=False)
    if sudo and password:
        stdin.write(password + "\n")
        stdin.flush()
        stdin.channel.shutdown_write()
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    if out:
        sys.stdout.write(out)
    if err:
        sys.stderr.write(err)
    return stdout.channel.recv_exit_status()


def upload(client, local: Path, remote: str) -> None:
    sftp = client.open_sftp()

    def ensure_dir(path: str) -> None:
        parts: list[str] = []
        current = path
        while current not in ("", "/"):
            parts.append(current)
            current = posixpath.dirname(current)
        for item in reversed(parts):
            try:
                sftp.stat(item)
            except IOError:
                sftp.mkdir(item)

    if local.is_dir():
        ensure_dir(remote)
        for root, dirs, files in os.walk(local):
            rel = os.path.relpath(root, local)
            target = remote if rel == "." else posixpath.join(remote, rel.replace(os.sep, "/"))
            ensure_dir(target)
            for directory in dirs:
                ensure_dir(posixpath.join(target, directory))
            for name in files:
                source = Path(root) / name
                destination = posixpath.join(target, name)
                sftp.put(str(source), destination)
                mode = source.stat().st_mode
                if mode & stat.S_IXUSR:
                    sftp.chmod(destination, 0o755)
    else:
        ensure_dir(posixpath.dirname(remote))
        sftp.put(str(local), remote)
        if local.stat().st_mode & stat.S_IXUSR:
            sftp.chmod(remote, 0o755)
    sftp.close()


def info(client, config: dict[str, str]) -> int:
    remote_dir = config.get("STREAMSOUND_REMOTE_DIR", "")
    service = config.get("STREAMSOUND_SERVICE", "streamsound")
    music = config.get("STREAMSOUND_MUSIC_ROOT", "")
    port = config.get("STREAMSOUND_PORT", "8080")
    commands = [
        "hostname",
        "node --version",
        "npm --version",
        f"systemctl is-active {service}",
        f"systemctl is-enabled {service}",
        f"test -d {music} && find {music} -maxdepth 2 -type f | wc -l",
        f"test -d {remote_dir} && ls -1 {remote_dir}",
        f"cat {remote_dir}/.env",
        f"curl -s -m 3 http://127.0.0.1:{port}/health",
    ]
    for command in commands:
        print(f"$ {command}")
        code = run(client, command)
        if code != 0:
            print(f"[exit {code}]")
        print()
    return 0


def main() -> int:
    env_path = Path(os.environ.get("STREAMSOUND_DEPLOY_ENV", DEFAULT_ENV))
    config = load_config(env_path)

    parser = argparse.ArgumentParser(description="StreamSound 远程助手")
    sub = parser.add_subparsers(dest="action", required=True)
    sub.add_parser("info")

    run_parser = sub.add_parser("run")
    run_parser.add_argument("command")

    sudo_parser = sub.add_parser("sudo")
    sudo_parser.add_argument("command")

    upload_parser = sub.add_parser("upload")
    upload_parser.add_argument("local")
    upload_parser.add_argument("remote")

    args = parser.parse_args()
    if not env_path.exists():
        return print(f"找不到配置文件：{env_path}") or 1

    client = connect(config)
    try:
        if args.action == "info":
            return info(client, config)
        if args.action == "run":
            return run(client, args.command)
        if args.action == "sudo":
            return run(client, args.command, config.get("STREAMSOUND_SSH_PASSWORD"), sudo=True)
        if args.action == "upload":
            upload(client, Path(args.local), args.remote)
            print(f"已上传 {args.local} -> {args.remote}")
            return 0
    finally:
        client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
