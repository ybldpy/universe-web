import axios from "axios";
import {tokenKey} from "../../commons/constants";





const getDefaultHeader = ()=>{return {Authorization:localStorage.getItem(tokenKey)}}



const createResult = function(response){


    const result = {
        requestSuccess:true,
        response:null,
        error:null
    }
    if (response.status!==200){
        result.requestSuccess = false
        result.error = response.statusText
    }
    else if (response.data.code!==200){
        result.requestSuccess = false
        result.error = response.data.msg
    }
    result.response = response

    return result;
}

export const get = async function(requestUrl,params,headers = {}){

    const requestHeaders = {...getDefaultHeader(),...headers}
    try{
        const response = await axios.get(requestUrl,{headers:requestHeaders,params:params})
        return createResult(response);
    }
    catch(e){

        return {
            requestSuccess:false,
            error:e
        }

    }

}

export const post = async function (requestUrl,data,headers={}){

    const requestHeaders = {...getDefaultHeader(),...headers};
    const result = {
        requestSuccess:true,
        response:null,
        error:null
    }
    try {
        const response = await axios.post(requestUrl, data, {
            headers: requestHeaders
        })

        return createResult(response);
    }
    catch (e){
        result.requestSuccess = false
        result.error = e
        return result;
    }
}