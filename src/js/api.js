import {SERVER_ADDRESS} from "../commons/config";

export const JUMP_ADDRESS = {
    LOG_IN:"/login.html",
    UNIVERSE:"/digitalUniverse.html"
}

export const BACKEND_API = {
    LOG_IN:`${SERVER_ADDRESS}/user/login`,
    FILE_UPLOAD_CANCEL:`${SERVER_ADDRESS}/file/cancelUploadTask`,
    FILE_UPLOAD_CHUNK: `${SERVER_ADDRESS}/file/chunkUpload`,
    FILE_UPLOAD_CREATE: `${SERVER_ADDRESS}/file/createFileUploadTask`,
    FILE_QUERYALL: `${SERVER_ADDRESS}/file/queryAll`,
    FILE_DELETE:`${SERVER_ADDRESS}/file/delete`
}

