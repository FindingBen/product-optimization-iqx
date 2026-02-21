import OpenAI from 'openai';

class OpenAuthInit{
    constructor({}){
    }


    async clientAuth(){
        const openai = new OpenAI({
            apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
        });
        return openai;
    }
}

export {OpenAuthInit}