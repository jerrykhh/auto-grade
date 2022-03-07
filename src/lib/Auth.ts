import { Auth } from "aws-amplify";

export async function AuthSession() {
    try{
        return await Auth.currentSession();
    }catch{
        window.location.href = "/";
        return null;
    }
}