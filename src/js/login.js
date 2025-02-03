import {createApp} from "vue";
import Login from "../pages/login.vue";
import 'element-plus/dist/index.css'
import {checkTokenValidation} from "./utils/authUtil";
import {DIGITAL_UNIVERSE_ADDRESS, LOGIN_ADDRESS} from "../commons/config";

if(checkTokenValidation()){
    window.location.href = DIGITAL_UNIVERSE_ADDRESS
}
else{
    const app = createApp(Login)
    app.mount("#root")
}




