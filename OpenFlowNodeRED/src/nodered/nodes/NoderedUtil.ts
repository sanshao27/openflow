import { Red } from "node-red";
import { QueryMessage, Message, InsertOneMessage, UpdateOneMessage, DeleteOneMessage, InsertOrUpdateOneMessage, SigninMessage, TokenUser, mapFunc, reduceFunc, finalizeFunc, MapReduceMessage, JSONfn } from "../../Message";
import { WebSocketClient } from "../../WebSocketClient";
import { Crypt } from "../../Crypt";

export class NoderedUtil {
    public static IsNullUndefinded(obj:any) {
        if(obj===null || obj===undefined) { return true; }
        return false;
    }
    public static IsNullEmpty(obj:any) {
        if(obj===null || obj===undefined || obj==="") { return true; }
        return false;
    }
    public static IsString(obj:any) {
        if (typeof obj === 'string' || obj instanceof String) { return true; }
        return false;
    }
    public static isObject(obj:any):boolean {
        return obj === Object(obj);
    }
    public static FetchFromObject(obj:any, prop:string):any {
        if (typeof obj === 'undefined') {
            return false;
        }
        var _index = prop.indexOf('.')
        if (_index > -1) {
            return NoderedUtil.FetchFromObject(obj[prop.substring(0, _index)], prop.substr(_index + 1));
        }
        return obj[prop];
    }
    public static saveToObject(obj:any, path:string, value:any):any {
        const pList = path.split('.');
        const key = pList.pop();
        const pointer = pList.reduce((accumulator, currentValue) => {
            if (accumulator[currentValue] === undefined) accumulator[currentValue] = {};
            return accumulator[currentValue];
        }, obj);
        if (NoderedUtil.isObject(pointer)) {
            pointer[key] = value;
        } else {
            throw new Error(path + ' is not an object!')
        }
        return obj;
    }
    public static HandleError(node:Red, error:any):void {
        console.error(error);
        var message:string = error;
        if(error.message) { 
            message = error.message;
            node.error(error.message, message); 
        } else {
            node.error(error, message); 
        }
        if(NoderedUtil.IsNullUndefinded(message)) { message = ""; }
        node.status({fill:"red",shape:"dot",text:message.substr(0,32)});
    }




    public static async Query(collection:string, query:any, projection:any, orderby:any, top:number, skip:number, jwt:string):Promise<any[]> {
        var q:QueryMessage = new QueryMessage(); q.collectionname = collection;
        q.orderby = orderby; q.projection = projection;
        q.query = query; q.skip = skip; q.top = top; q.jwt = jwt;
        var _msg:Message = new Message();
        _msg.command = "query"; _msg.data = JSON.stringify(q);
        var result:QueryMessage = await WebSocketClient.instance.Send<QueryMessage>(_msg);
        return result.result;
    }
    public static async InsertOne(collection:string, item:any, jwt:string):Promise<any> {
        var q:InsertOneMessage = new InsertOneMessage(); q.collectionname = collection;
        q.item = item; q.jwt = jwt;
        var _msg:Message = new Message();
        _msg.command = "insertone"; _msg.data = JSON.stringify(q);
        var result:QueryMessage = await WebSocketClient.instance.Send<QueryMessage>(_msg);
        return result.result;
    }
    public static async UpdateOne(collection:string, item:any, jwt:string):Promise<any> {
        var q:UpdateOneMessage = new UpdateOneMessage(); q.collectionname = collection;
        q.item = item; q.jwt = jwt;
        var _msg:Message = new Message();
        _msg.command = "updateone"; _msg.data = JSON.stringify(q);
        var result:QueryMessage = await WebSocketClient.instance.Send<QueryMessage>(_msg);
        return result.result;
    }
    public static async InsertOrUpdateOne(collection:string, item:any, uniqeness:string, jwt:string):Promise<any> {
        var q:InsertOrUpdateOneMessage = new InsertOrUpdateOneMessage(); q.collectionname = collection;
        q.item = item; q.jwt = jwt; q.uniqeness = uniqeness;
        var _msg:Message = new Message();
        _msg.command = "insertorupdateone"; _msg.data = JSON.stringify(q);
        var result:QueryMessage = await WebSocketClient.instance.Send<QueryMessage>(_msg);
        return result.result;
    }
    
    public static async DeleteOne(collection:string, id:string, jwt:string):Promise<any> {
        var q:DeleteOneMessage = new DeleteOneMessage(); q.collectionname = collection;
        q._id = id; q.jwt = jwt;
        var _msg:Message = new Message();
        _msg.command = "deleteone"; _msg.data = JSON.stringify(q);
        var result:QueryMessage = await WebSocketClient.instance.Send<QueryMessage>(_msg);
        return result.result;
    }
    
    public static async MapReduce(collection:string, map: mapFunc, reduce: reduceFunc, finalize: finalizeFunc, query: any, out:string | any, scope:any, jwt:string):Promise<any> {
        var q: MapReduceMessage<any> = new MapReduceMessage(map, reduce, finalize, query, out);
        q.collectionname = collection; q.scope = scope; q.jwt = jwt;
        var msg:Message  = new Message(); msg.command = "mapreduce"; q.out = out;
        msg.data = JSONfn.stringify(q);
        var result:QueryMessage = await WebSocketClient.instance.Send<QueryMessage>(msg);
        return result.result;
    }

    public static async GetToken(username:string, password:string):Promise<SigninMessage> {
        var q:SigninMessage = new SigninMessage(); q.validate_only = true;
        if(!NoderedUtil.IsNullEmpty(username)  && !NoderedUtil.IsNullEmpty(password)) {
            q.username = username; q.password = password;
        } else {
            if(Crypt.encryption_key === "") { throw new Error("root signin not allowed"); }
            var user = new TokenUser(); user.name = "root"; user.username = "root";
            q.jwt = Crypt.createToken(user);
        }
        var _msg:Message = new Message();
        _msg.command = "signin"; _msg.data = JSON.stringify(q);
        var result:SigninMessage = await WebSocketClient.instance.Send<SigninMessage>(_msg);
        return result;
    }

}