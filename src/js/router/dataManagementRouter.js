
import {createRouter, createWebHistory} from "vue-router";
import UploadedDataManagement from "../../pages/dataManagement/uploadedDataManagement.vue"
import DataUpload from "../../pages/dataManagement/dataUpload.vue"



const routes = [
    {
        path:"/dataManagement/uploadedDataManagement",
        name:"Uploaded Data Management",
        component:UploadedDataManagement
    },
    {
        path:"/dataManagement/dataUpload",
        name:"Data Upload",
        component: DataUpload
    }
]
export default createRouter({
    history:createWebHistory(),
    routes
})





