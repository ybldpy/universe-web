import {tokenKey} from "../../commons/constants";

export const checkTokenValidation = function (){
    const token = localStorage.getItem(tokenKey)
    if (token) {
        // 解码 JWT token，获取 payload 部分
        const payload = JSON.parse(atob(token.split('.')[1])); // atob 用于解码 base64 字符串
        // 获取 token 的过期时间（exp），并转换为毫秒
        const expTime = payload.exp * 1000;  // exp 是秒，转为毫秒
        // 当前时间
        const currentTime = Date.now();
        // 判断 token 是否过期
        if (currentTime >= expTime) {
            return false;
        }
        else {
            return true;
        }
    }
    else {
        return false;
    }
}

export const isUnAuthed = function (response){



    return response.status === 401 || response.status === 403 || response.data.code === 403;



}