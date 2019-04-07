
const {Client} = require('@elastic/elasticsearch');
const config = require('./global_configuration');

/*
    The structure of elastic storage follows below.
    /document_id = {
        'main_index': // all the major index like abstract of pdf, image tag goes here.
        'secondary_index': //more elaborated text. This is tested only if main_index query return the

    }

    multi_tenancy is acheived through collections.
    context is based on user and index : {tenant_id}__{index_id}

*/
class Retriver {

    /*
        Abstraction to add more mapping. Configuration shouldn't be bounded with actual configuration. Especially for login 
    */
    generate_elastic_config(){
        
        let global_config = {};
        global_config['url'] = this.elastic_config['url'];
        global_config['host'] = this.elastic_config['url'];
        global_config['node'] = this.elastic_config['url'];
        //console.log(global_config);
        return global_config;
    }
    /*
        Get the index id from tenant infor and user info
    */
    
    get_elastic_index(){

        // for testing.
        if (!this.user_info){
            return "default__index";
        }
        
        else{
            return this.user_info+"__";
        }
    }
    get_elastic_type(){
        if(!this.type_info){
            return "global_type";
        }
        else{
            return this.type_info;
        }

    }

    generate_url(){

        let url = elastic_config['url'];
        
    }

    /*
        Abstraction for client creation. Required for future enhancement.
        Can implement pool below incase required. Have to check performance bottleneck first.
    */
    get_client(global_config){

        let mapped_config = this.generate_elastic_config(global_config);
        //console.log(mapped_config);
        let client = new Client(mapped_config);
        return client;
    }
    generate_query(query,primary=true){

        let index = this.get_elastic_index();
        let type = this.get_elastic_type();
        let gnerated_query = {'index':index,'type':type};
        if (primary){
            gnerated_query['body']={"query":{"term":{'main_index':query}}};
        }
        else{
            gnerated_query['body']={'secondary_index':query};
        }
        console.log(gnerated_query)
        return gnerated_query;
        
    }
    constructor(user_info=null,type_info=null){

        return(async()=>{
        this.elastic_config = await config.get_elastic_configuration();
        this.client = this.get_client();
        this.user_info = user_info || ""; //required for multi tenancy.
        this.type_info = type_info || "";
        return this;
        })();

    };

    generate_fileid_from_name(file_name){
        return (this.user_info||"default_user")+"__"+(this.type_info||"default_type")+"__"+file_name;
    }

    async insert_document(main_index,secondary_index,file_name,user_info){
        //let client = this.get_client();
        // let temp_msg = {
        //     index: this.get_elastic_index(),
        //     type: this.get_elastic_type(),
        //     body: {
        //       'main_index':main_index,
        //       'secondary_index':secondary_index,
        //       'file_name':file_name,
        //       'file_id':this.generate_fileid_from_name(file_name)
        //     }};

        // console.log(JSON.stringify(temp_msg));

        this.client.index({
            index: this.get_elastic_index(),
            type: this.get_elastic_type(),
            body: {
              'main_index':main_index,
              'secondary_index':secondary_index,
              'file_name':file_name,
              'file_id':this.generate_fileid_from_name()
            }
          }).then(()=>{
              console.log("Finished insert");
          },(err)=>{ console.log("Rejected index creation msg:"+err)});
    }

    async search_document(query=''){

        let client =  this.client;
        let elastic_query = this.generate_query(query);
        console.log(JSON.stringify(elastic_query));
        client.search(elastic_query,(err,result)=>{
            if (err){
                return Promise.reject(err);
            }
            else{
                
                if (!result.isEmpty()){
                    return Promise.resolve(result);
                }
                else{

                    // go for secondary query.
                    elastic_query = this.generate_query(query,false);
                    client.search(elastic_query,(err,result)=>{

                        if(err){
                            return Promise.reject(err);
                        }
                        else{
                            return Promise.resolve(result);
                        }
                    });
                }
                
                
            }
            
        });
    };
    
}
exports.Retriver = Retriver;

var test = async ()=>{
    let ret_class = await new Retriver();
    let query = "shibin";
    let primary_index = "Winter is here";
    let secondary_index = "Watch GOT. Don't miss";
    let file_name = "shibin.txt";
    await ret_class.insert_document(primary_index,secondary_index,file_name);
    let result = await ret_class.search_document(query);
    console.log(result);
};


// main method for testing
if(require.main==module){
    test();
}
