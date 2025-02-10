import {createApp} from "vue";
import 'element-plus/dist/index.css'
import DataManagementRouter from "./router/dataManagementRouter";
import DataManagement from "../pages/dataManagement.vue";
import {checkTokenValidation} from "../js/utils/authUtil";
import {LOGIN_ADDRESS} from "../js/commons/config";


if (!checkTokenValidation()){
    window.location.href = LOGIN_ADDRESS
}

const app = createApp(DataManagement)
app.use(DataManagementRouter)
app.mount("#root")


