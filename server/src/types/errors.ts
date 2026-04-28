export interface AppError {
  code: string;
  message: string;
  detail: string;
  httpStatus: number;
}

export function createError(
  code: string,
  message: string,
  detail: string,
  httpStatus: number,
): AppError {
  return { code, message, detail, httpStatus };
}

// AUTH errors
export const AUTH_001 = createError('AUTH_001', '请求体缺少必填字段', 'username or password is missing', 400);
export const AUTH_002 = createError('AUTH_002', '用户名或密码错误', 'Invalid username or password', 401);
export const AUTH_003 = createError('AUTH_003', 'Access Token 已过期', 'Access token expired', 401);
export const AUTH_004 = createError('AUTH_004', 'Access Token 无效', 'Invalid access token', 401);
export const AUTH_005 = createError('AUTH_005', 'Refresh Token 已过期或无效', 'Refresh token expired or invalid', 401);
export const AUTH_006 = createError('AUTH_006', '账号待管理员审核', 'Account pending admin approval', 403);
export const AUTH_007 = createError('AUTH_007', '用户名已被注册', 'Username already taken', 409);

// LIBRARY errors
export const LIB_001 = createError('LIB_001', '文件夹不存在', 'Folder not found', 404);
export const LIB_002 = createError('LIB_002', '曲目不存在', 'Track not found', 404);
export const LIB_003 = createError('LIB_003', '音乐库尚未完成扫描', 'Library scan not completed', 500);

// STREAM errors
export const STREAM_001 = createError('STREAM_001', '曲目不存在', 'Track not found', 404);
export const STREAM_002 = createError('STREAM_002', '音频文件读取失败', 'Audio file read failed', 500);
export const STREAM_003 = createError('STREAM_003', 'Range 请求格式错误', 'Invalid Range header', 400);

// SEARCH errors
export const SEARCH_001 = createError('SEARCH_001', '搜索关键词为空或长度超限', 'Search query empty or too long', 400);

// FAVORITES errors
export const FAV_001 = createError('FAV_001', '曲目不存在', 'Track not found', 404);
export const FAV_002 = createError('FAV_002', '该曲目已在收藏列表中', 'Track already favorited', 409);
export const FAV_003 = createError('FAV_003', '该曲目不在收藏列表中', 'Track not in favorites', 404);

// HISTORY errors
export const HIST_001 = createError('HIST_001', '曲目不存在', 'Track not found', 404);

// ADMIN errors
export const ADMIN_001 = createError('ADMIN_001', '需要管理员权限', 'Admin role required', 403);
export const ADMIN_002 = createError('ADMIN_002', '目标用户不存在', 'User not found', 404);
export const ADMIN_003 = createError('ADMIN_003', '扫描任务正在进行中', 'Scan already in progress', 409);

export function sendError(
  reply: { code: (status: number) => { send: (body: unknown) => void } },
  error: AppError,
): void {
  reply.code(error.httpStatus).send({
    error: {
      code: error.code,
      message: error.message,
      detail: error.detail,
    },
  });
}
