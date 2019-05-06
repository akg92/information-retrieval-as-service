
import os
import requests
import math
class Evaluate():
    def __init__(self):
        """
        Do nothing
        """

    def get_abs_path(self,path):
        return os.path.abspath(os.path.join(os.path.dirname(__file__),path))

class TextEvaluate(Evaluate):
    data_dir = './data/cranfield'
    external_base_url = 'http://localhost:8080'
    external_post_url = external_base_url+'/content/test_context'
    external_get_url = external_base_url+'/search'
    def __init__(self):
        Evaluate.__init__(self)
        self.text_folder = self.get_text_folder()
    ## get text folder    
    def get_text_folder(self):
        return self.get_abs_path(os.path.join(self.data_dir,"texts"))

    def get_file_name(self,title,id):
        title = title.replace(" ",'_')
        ## limit file name
        title = title[1:min(12,len(title))]
        return os.path.join(self.text_folder,title+'_'+id+".txt")

## sample cranfiled documen
    def write_single_doc(self,single_doc):
        file_name = self.get_file_name(single_doc['title'],single_doc['id'])
        with open(file_name,'w') as f:
            f.write(single_doc['title']+" "+single_doc['author']+" "+single_doc['content'])


    ## initalize to check if first try
    ## return incase of first try
    def initalize(self):
        ## if the path exist skip it
        if os.path.exists(self.text_folder):
            return False
        else:
            os.mkdir(self.text_folder)
            data_file_name = self.get_abs_path(os.path.join(self.data_dir,'cran.all.1400'))

            with open(data_file_name) as f:
                single_doc = {}
                line = f.readline()
                cur_content = ""
                cur_type = 'id'
                while line:
                    ## new content 
                    line = line.replace("\n"," ")
                    if line.startswith('.'):
                        ## starting of new
                        single_doc[cur_type] = cur_content 
                        if line.startswith('.I'):
                            if 'content' in single_doc:
                                self.write_single_doc(single_doc)
                            single_doc = {}
                            cur_content = line.split(" ")[1]
                            cur_type = "id"
                        elif line.startswith(".W"):
                            cur_type = "content"
                            cur_content = ""
                        elif line.startswith(".T"):
                            cur_type = "title"
                            cur_content = ""
                        
                        elif line.startswith(".A"):
                            cur_type = "author"
                            cur_content = ""
                        elif line.startswith(".B"):
                            cur_type = "year"
                            cur_content = ""
                    else:
                        if not cur_content:
                            cur_content = " "
                        cur_content += line
                    ## read new line 
                    line = f.readline()
                single_doc[cur_type] = cur_content
                self.write_single_doc(single_doc)

        return True

    def get_all_instances(self,file_name):
        result = []
        with open(file_name) as f:
                single_doc = {}
                line = f.readline()
                cur_content = ""
                cur_type = 'id'
                while line:
                    ## new content 
                    line = line.replace("\n","")
                    if line.startswith('.'):
                        ## starting of new
                        single_doc[cur_type] = cur_content 
                        if line.startswith('.I'):
                            if 'content' in single_doc:
                                result.append(single_doc)
                            single_doc = {}
                            cur_content = line.split(" ")[1]
                            cur_type = "id"
                        elif line.startswith(".W"):
                            cur_type = "content"
                            cur_content = ""
                        elif line.startswith(".T"):
                            cur_type = "title"
                            cur_content = ""
                        
                        elif line.startswith(".A"):
                            cur_type = "author"
                            cur_content = ""
                        elif line.startswith(".B"):
                            cur_type = "year"
                            cur_content = ""
                    else:
                        if not cur_content:
                            cur_content= ""
                        cur_content += line
                    ## read new line 
                    line = f.readline()

                result.append(single_doc)

        return result

    def load_ranking_matrix(self,rel_file):
        rel_ranking = {}
        
        with open(rel_file) as f:
            for line in f:
                line = line.replace("\n","")
                ids = [int(x) for x in line.split()]
                ## few error entries
                if len(ids)!=3:
                    pass
                if not ids[0] in rel_ranking:
                    rel_ranking[ids[0]] = []
                rel_ranking[ids[0]].append((ids[1],ids[2]))
        return rel_ranking

    def get_file_id_from_name(self,file_name):
        try:
            id = int(file_name.split("_")[-1].split(".")[0])
            return id
        except :
            return None

    ## make get call and get result
    def fire_query_get_result(self,text):
        r = requests.get(self.external_get_url,params={"query":text})
        r = r.json()
        result = []
        for ele in r:
            file_id = self.get_file_id_from_name(ele["file_name"])
            if file_id:
                result.append(file_id)
        return result 

    ## do only once
    def push_all_files(self):
        files = os.listdir(self.text_folder)
        for file in files:
            file = os.path.join(self.text_folder,file)
            file_upload = {'file': open(file, 'r')}
            r = requests.post(self.external_post_url,files=file_upload)
            if r.status_code==200:
                print("Successfully uploaded {}".format(file))
            else:
                print(" Fail upload {}".format(file))

            

    ## get query    
    def get_queries_result(self):
        query_file = self.get_abs_path(os.path.join(self.data_dir,"cran.qry"))
        
        all_queries =self.get_all_instances(query_file)

        all_result = {}
        for query in all_queries:
            if 'content' in query:
                q_result = self.fire_query_get_result(query['content'])
                id = int(query['id'])
                all_result[id] = q_result
            else:
                pass 
            #print(query['content']+":"+str(q_result))

    

        return  all_result

    def calculate_idcg(self,key,rel_matrix,n=5):
        sorted_rank = sorted(rel_matrix[key],key=lambda x:x[1])
        result = 0 
        n = min(n,len(sorted_rank))
        for i in range(n):
            ##ndcg
            result += (6-sorted_rank[i][1])/math.log2(i+2) 

        return result 
    def calculate_ndcg(self,sorted_rank,actual_rank,n=5):
        #sorted_rank = sorted(rel_matrix[key],key=lambda x:x[1])
        result = 0 
        n = min(n,len(sorted_rank),len(actual_rank))
        mapping = {}
        for x,y in actual_rank:
            mapping[x] = y 

        for i in range(n):
            ##ndcg
            key = sorted_rank[i]
            rel = 5
            if key in mapping:
                rel = mapping[key] 
            result += (6-rel)/math.log2(i+2) 
        return result 
    def precision_and_recall(self,actual,ours):
        precision=recall = 0 
        count = 0
        for key in ours.keys():
            if key not in actual:
                continue
            count += 1
            actual_single = set([x[0] for x in actual[key]])
            total_true = 0
            for id in ours[key]:
                if id in actual_single:
                    total_true += 1
            precision += 1 if total_true>5 else total_true/len(ours[key])
            recall  += 1 if total_true>5 else  total_true/len(actual[key])
        print(count)
        return 100*precision/count,100*recall/count 
        
    def evaluate(self):
        rel_file  =  self.get_abs_path(os.path.join(self.data_dir,"cranqrel"))
        rel_matrix = self.load_ranking_matrix(rel_file)
        our_result = self.get_queries_result()
        n_s = [1,5,10,30]
        result = []
        for n in n_s:
            count = 0 
            total = 0.
            for key in our_result.keys():
                if key in rel_matrix:
                    idcg = self.calculate_idcg(key,rel_matrix,n=n)
                    ndcg = self.calculate_ndcg(our_result[key],rel_matrix[key],n=n)
                    if idcg!=0:
                        count += 1
                        total += ndcg/idcg
            result.append(total/count)
        for x,y in zip(n_s,result):
            print('ndcg@{}={}'.format(x,y))
        precision,recall = self.precision_and_recall(rel_matrix,our_result)
        print("precision={} recall={}".format(precision,recall))
        return result 







                        


class ImageEvaluate(Evaluate):
    data_dir = './data/cranfield'
    external_base_url = 'http://localhost:8080'
    external_post_url = external_base_url+'/content/test_context'
    external_get_url = external_base_url+'/search'
    def __init__(self):
        Evaluate.__init__(self)
        self.text_folder = self.get_text_folder()

def text_evaluate():
    obj = TextEvaluate()
    is_first = obj.initalize()
    ## only if first push files
    if is_first:
    #pass
        obj.push_all_files()
    ## query
    result = obj.evaluate()

if __name__ == "__main__":
    text_evaluate()