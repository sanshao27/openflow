import { fetch, toPassportConfig } from "passport-saml-metadata";
import * as fs  from "fs";
import * as retry  from "async-retry";
import { json } from "body-parser";
import { DatabaseConnection } from "./DatabaseConnection";
import { Provider } from "./LoginProvider";
import { TokenUser } from "./TokenUser";

export class Config {
    public static db:DatabaseConnection = null;
    public static auto_create_users:boolean = Config.parseBoolean(Config.getEnv("auto_create_users", "false"));
    public static auto_create_domains:string[] = Config.parseArray(Config.getEnv("auto_create_domains", ""));
    public static allow_user_registration:boolean = Config.parseBoolean(Config.getEnv("allow_user_registration", "false"));

    public static api_bypass_perm_check:boolean = Config.parseBoolean(Config.getEnv("api_bypass_perm_check", "false"));
    public static websocket_package_size:number = parseInt(Config.getEnv("websocket_package_size", "1024"), 10);
    public static signing_crt:string = Config.getEnv("signing_crt", "");
    public static singing_key:string = Config.getEnv("singing_key", "");
    public static tls_crt:string = Config.getEnv("tls_crt", "");
    public static tls_key:string = Config.getEnv("tls_key", "");
    public static tls_ca: string = Config.getEnv("tls_ca", "");
    public static tls_passphrase:string = Config.getEnv("tls_passphrase", "");
    public static port:number = parseInt(Config.getEnv("port", "3000"));
    public static domain:string = Config.getEnv("domain", "localhost");
    // public static login_providers:Provider[] = [];
    public static amqp_url: string = Config.getEnv("amqp_url", "amqp://localhost");
    public static mongodb_url:string = Config.getEnv("mongodb_url", "mongodb://localhost:27017");
    public static mongodb_db:string = Config.getEnv("mongodb_db", "openflow");

    public static aes_secret:string = Config.getEnv("aes_secret", "");

    public static baseurl():string {
        if (Config.tls_crt != '' && Config.tls_key != '') {
            return "https://" + Config.domain + ":" + Config.port + "/";
        }
        return "http://" + Config.domain + ":" + Config.port + "/";
    }
    // public static async get_login_providers():Promise<void> {
    //     this.login_providers = await Config.db.query<Provider>({_type: "provider"}, null, 1, 0, null, "config", TokenUser.rootToken());
    //     // if(this.login_providers.length > 0) { return; }
    //     if(fs.existsSync("config/login_providers.json")) {
    //         // this.login_providers = JSON.parse(fs.readFileSync("config/login_providers.json", "utf8"));
    //     }
    // }
    public static getEnv(name:string, defaultvalue:string):string {
        var value:any = process.env[name];
        if (!value || value === "") { value = defaultvalue; }
        return value;
    }
    public static async parse_federation_metadata(url:string): Promise<any> {
        // if anything throws, we retry
        var metadata:any = await retry(async bail => {
            var reader:any = await fetch({ url });
            if(reader === null || reader === undefined) { bail(new Error("Failed getting result")); return; }
            var config:any = toPassportConfig(reader);
            // we need this, for Office 365 :-/
            if (reader.signingCerts && reader.signingCerts.length > 1) {
                config.cert = reader.signingCerts;
            }
            return config;
        }, {
            retries: 50,
            onRetry: function(error:Error, count:number):void {
                console.log("retry " + count + " error " + error.message + " getting " + url);
            }
        });
        return metadata;
    }
    public static parseArray(s:string):string[] {
        var arr = s.split(",");
        arr = arr.map(p => p.trim());
        arr = arr.filter(result => (result.trim() !== ""));
        return arr;
    }
    public static parseBoolean(s:any):boolean {
        var val:string = "false";
        if (typeof s === "number") {
            val = s.toString();
        } else if (typeof s === "string") {
            val = s.toLowerCase().trim();
        } else if (typeof s === "boolean") {
            val = s.toString();
        } else {
            throw new Error("Unknown type!");
        }
        switch(val) {
            case "true": case "yes": case "1": return true;
            case "false": case "no": case "0": case null: return false;
            default: return Boolean(s);
        }
    }

}
