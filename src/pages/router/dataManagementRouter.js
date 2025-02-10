
import {createRouter, createWebHashHistory, createWebHistory} from "vue-router";
import UploadedDataManagement from "../dataManagement/management.vue"
import DataUpload from "../dataManagement/dataUpload.vue"
import DataManagement from "../dataManagement.vue";


const routes = [

    {
        path:"/",
        name:"Uploaded Data Management",
        component:UploadedDataManagement
    },
    {
        path:"/upload",
        name:"Data Upload",
        component: DataUpload
    }
]
export default createRouter({
    history:createWebHashHistory(),
    routes,
})





