import {devEnv, SERVER_ADDRESS} from "./commons/config";

export const JUMP_ADDRESS = {
    LOG_IN:"/login.html",
    UNIVERSE:"/digitalUniverse.html"
}

const prefix = devEnv?SERVER_ADDRESS:"/api"

export const BACKEND_API = {
    LOG_IN:`${prefix}/user/login`,
    REGISTER:`${prefix}/user/register`,
    FILE_UPLOAD_CANCEL:`${prefix}/file/cancelUploadTask`,
    FILE_UPLOAD_CHUNK: `${prefix}/file/chunkUpload`,
    FILE_UPLOAD_CREATE: `${prefix}/file/createFileUploadTask`,
    FILE_QUERYALL: `${prefix}/file/queryFiles`,
    FILE_DELETE:`${prefix}/file/delete`,
    FILE_FETCH:`${prefix}/file/get`,
    TILE_DOWNLOAD_PROXY: `${prefix}/tileProxy/getTile`
}


export const PARAMETERS = {
    FILE:{
        STATUS:{
            READY:3
        },
        CATEGORY:{
            CATALOG:0,
            LAYER:1
        }
    }
}

