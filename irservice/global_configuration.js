

const process = require('process');
const fs = require('fs');
const {promisify} = require('util');
var TEST_GLOBAL_CONFIG = {

    "elastic_search_url" :"",
    "authentication_method":"",
    "password":"",
    "username":"",
    "certificate":""
};
//global configuration from the settings
var MODE = process.env.MODE || 'debug';

var ELASTIC_CONFIG = null ; // for caching the configuration.
var CONFIG_LOADED_TIME = -1; // for configuration timeout event 
var STORAGE_CONFIG = null;

var read_config_file =  async (file_name='config.json')=>{

    const read_file = promisify(fs.readFile);
    let data = await read_file(file_name,'utf-8');
    let json_data =  JSON.parse(data);
    return json_data;
};
exports.get_elastic_configuration=async ()=>{

    // check the existing config loaded or not. Timeout is not included.

    if (ELASTIC_CONFIG){
        return ELASTIC_CONFIG;
    }

    //incase of mode is debug load from the local file.
    // else load from the s3. Else part is yet to configure.
    if (MODE == 'debug' ){
        
        let all_config = await read_config_file();
        ELASTIC_CONFIG = all_config['elastic'];
    }



    return ELASTIC_CONFIG;

};

exports.get_storage_config= async ()=>{
    
    if(STORAGE_CONFIG){
        return STORAGE_CONFIG;
    }

    if (MODE=='debug'){
        let all_config = await read_config_file();
        STORAGE_CONFIG = all_config['storage'];
    }
    return STORAGE_CONFIG;
};

ML_CONFIG = null;
exports.get_ml_config=async ()=>{
    if(ML_CONFIG){
        return ML_CONFIG;
    }

    if (MODE=='debug'){
        let all_config = await read_config_file();
        ML_CONFIG = all_config['ml'];
    }
    return ML_CONFIG;

}

var test = async ()=>{
    let json = await exports.get_elastic_configuration();
    console.log(json);
};
/*
    Test code goes below.
*/
if(require.main==module){
    test();
}