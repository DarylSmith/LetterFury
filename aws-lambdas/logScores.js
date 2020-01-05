exports.handler = async (event) => {
    // TODO implement
    
    
     let params = JSON.parse(event.body);
     console.log(params);
        const AWS = require(`aws-sdk`);
    const ddb = new AWS.DynamoDB.DocumentClient({region: `us-east-1`});
    
    const TableName = 'dalyas-game2';
    const Item = {};
    Item['timestamp']=Date.now().toString();
    Item['highscore'] = params.highscore;
    Item['name'] = params.name;
        
   return{
       statusCode:200,
        body: JSON.stringify(await ddb.put({TableName, Item}).promise()),
         headers: {
            
            "Access-Control-Allow-Origin": "*"
        }
   }
};
