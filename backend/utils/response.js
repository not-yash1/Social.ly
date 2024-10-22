
export const Response = (res, statusCode, success, message, data) => {
    return res.status(statusCode).json({
        success: success,
        message: message,
        ...(data && { data: data }),
        // data: data ? data : undefined
    })
}