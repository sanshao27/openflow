function isNumber(value: string | number): boolean {
    return ((value != null) && !isNaN(Number(value.toString())));
}
module openflow {
    "use strict";
    export class SocketMessage {
        public id: string;
        public replyto: string;
        public command: string;
        public data: string;
        public count: number;
        public index: number;
        public static fromjson(json: string): SocketMessage {
            let result: SocketMessage = new SocketMessage();
            let obj: any = JSON.parse(json);
            result.command = obj.command;
            result.id = obj.id;
            result.replyto = obj.replyto;
            result.count = 1;
            result.index = 0;
            result.data = obj.data;
            if (isNumber(obj.count)) { result.count = obj.count; }
            if (isNumber(obj.index)) { result.index = obj.index; }
            if (result.id === null || result.id === undefined || result.id === "") {
                // result.id = crypto.randomBytes(16).toString("hex");
                result.id = Math.random().toString(36).substr(2, 9);
            }
            return result;
        }
        public static frommessage(msg: Message, data: string, count: number, index: number): SocketMessage {
            var result: SocketMessage = new SocketMessage();
            result.id = msg.id;
            result.replyto = msg.replyto;
            result.command = msg.command;
            result.count = count;
            result.index = index;
            result.data = data;
            return result;
        }

    }
    export class SigninMessage {
        public error: string;

        public realm: string;
        public firebasetoken: string;
        public onesignalid: string;
        public username: string;
        public password: string;
        public user: TokenUser;
        public jwt: string;
        public rawAssertion: string;
        static assign(o: any): SigninMessage {
            if (typeof o === "string" || o instanceof String) {
                return Object.assign(new SigninMessage(), JSON.parse(o.toString()));
            }
            return Object.assign(new SigninMessage(), o);
        }
    }
    export class TokenUser {
        _type: string;
        _id: string;
        name: string;
        username: string;
        roles: Rolemember[] = [];
    }
    export class Rolemember {
        constructor(name: string, _id: string) {
            this.name = name;
            this._id = _id;
        }
        name: string;
        _id: string;
    }
    export class QueryMessage {
        public error: string;

        public query: any;
        public projection: Object;
        public top: number;
        public skip: number;
        public orderby: Object | string;
        public collectionname: string;
        public result: any[];
        static assign(o: any): QueryMessage {
            if (typeof o === "string" || o instanceof String) {
                return Object.assign(new QueryMessage(), JSON.parse(o.toString()));
            }
            return Object.assign(new QueryMessage(), o);
        }
    }
    export class AggregateMessage {
        public error: string;
        public jwt: any;

        public aggregates: object[];
        public collectionname: string;
        public result: any[];
        static assign(o: any): AggregateMessage {
            if (typeof o === "string" || o instanceof String) {
                return Object.assign(new AggregateMessage(), JSON.parse(o.toString()));
            }
            return Object.assign(new AggregateMessage(), o);
        }
    }
    export class InsertOneMessage {
        public error: string;
        public jwt: any;

        public item: object;
        public collectionname: string;
        public result: any;
        static assign(o: any): InsertOneMessage {
            if (typeof o === "string" || o instanceof String) {
                return Object.assign(new InsertOneMessage(), JSON.parse(o.toString()));
            }
            return Object.assign(new InsertOneMessage(), o);
        }
    }
    export class UpdateOneMessage {
        public error: string;
        public jwt: any;

        public item: object;
        public collectionname: string;
        public result: any;
        static assign(o: any): UpdateOneMessage {
            if (typeof o === "string" || o instanceof String) {
                return Object.assign(new UpdateOneMessage(), JSON.parse(o.toString()));
            }
            return Object.assign(new UpdateOneMessage(), o);
        }
    }
    export class DeleteOneMessage {
        public error: string;
        public jwt: any;

        public _id: string;
        public collectionname: string;
        static assign(o: any): DeleteOneMessage {
            if (typeof o === "string" || o instanceof String) {
                return Object.assign(new DeleteOneMessage(), JSON.parse(o.toString()));
            }
            return Object.assign(new DeleteOneMessage(), o);
        }
    }


    export class RegisterQueueMessage {
        public error: string;
        public jwt: any;

        public queuename: string;
        static assign(o: any): RegisterQueueMessage {
            if (typeof o === "string" || o instanceof String) {
                return Object.assign(new RegisterQueueMessage(), JSON.parse(o.toString()));
            }
            return Object.assign(new RegisterQueueMessage(), o);
        }
    }
    export class QueueMessage {
        public error: string;
        public jwt: any;

        public correlationId: string;
        public replyto: string;
        public queuename: string;
        public data: any;
        static assign(o: any): QueueMessage {
            if (typeof o === "string" || o instanceof String) {
                return Object.assign(new QueueMessage(), JSON.parse(o.toString()));
            }
            return Object.assign(new QueueMessage(), o);
        }
    }


    export class Message {
        public id: string;
        public replyto: string;
        public command: string;
        public data: string;
        public static frommessage(msg: SocketMessage, data: string): Message {
            var result: Message = new Message();
            result.id = msg.id;
            result.replyto = msg.replyto;
            result.command = msg.command;
            result.data = data;
            return result;
        }

        public Process(cli: WebSocketClient): void {
            try {
                var command: string = "";
                if (this.command !== null && this.command !== undefined) { command = this.command.toLowerCase(); }
                if (this.command !== "ping" && this.command !== "pong") {
                    if (this.replyto !== null && this.replyto !== undefined) {
                        var qmsg: QueuedMessage = cli.messageQueue[this.replyto];
                        if (qmsg !== undefined && qmsg !== null) {
                            qmsg.message = Object.assign(qmsg.message, JSON.parse(this.data));
                            if (qmsg.cb !== undefined && qmsg.cb !== null) { qmsg.cb(qmsg.message); }
                            delete cli.messageQueue[this.id];
                        }
                        return;
                    }
                }
                switch (command) {
                    case "ping":
                        this.Ping(cli);
                        break;
                    case "refreshtoken":
                        this.RefreshToken(cli);
                        break;
                    case "queuemessage":
                        this.QueueMessage(cli);
                        break;
                    // case "signin":
                    //     this.Signin(cli);
                    //     break;
                    default:
                        console.error("Unknown command " + command);
                        this.UnknownCommand(cli);
                        break;
                }
            } catch (error) {
                console.error(error);
            }
        }
        public async Send(cli: WebSocketClient): Promise<void> {
            await cli.Send(this);
        }
        private async UnknownCommand(cli: WebSocketClient): Promise<void> {
            this.Reply("error");
            this.data = "Unknown command";
            await this.Send(cli);
        }
        private async Ping(cli: WebSocketClient): Promise<void> {
            this.Reply("pong");
            await this.Send(cli);
        }
        public Reply(command: string): void {
            this.command = command;
            this.replyto = this.id;
            this.id = Math.random().toString(36).substr(2, 9);
        }
        private RefreshToken(cli: WebSocketClient): void {
            var msg: SigninMessage = SigninMessage.assign(this.data);
            cli.jwt = msg.jwt;
            cli.user = msg.user;
            console.log("Message::RefreshToken: Updated jwt");
        }
        private QueueMessage(cli: WebSocketClient): void {
            var msg: QueueMessage = QueueMessage.assign(this.data);
            msg.replyto = msg.correlationId;
            cli.$rootScope.$broadcast("queuemessage", msg);
            this.Reply("queuemessage");
            this.Send(cli);
        }
        
    }

}
