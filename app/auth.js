import OpenAI from 'openai';

class OpenAuthInit{
    constructor({}){
    }


    async clientAuth(){
        const openai = new OpenAI({
            apiKey: process.env['OPENAI_API_KEY'],
        });
        return openai;
    }
}

export {OpenAuthInit}