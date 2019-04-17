"use strict";

import language from '@google-cloud/language';

export default class GoogleSpeechAPI {
    client;

    constructor() {
        this.client = new language.LanguageServiceClient();
        this.getSalience = this.getSalience.bind(this);
    }

    async getSalience(text) {
        const document = { 
            content: text,
            type: 'PLAIN_TEXT'
        };
        try {
            const [result] = await this.client.analyzeEntities({document});
            const entities = result.entities;
            if (entities.length != 0 && entities[0].salience > 0.5) {
                console.log(`Most salient topic: ${entities[0].name}, Salience: ${entities[0].salience}`);
                entities.forEach(entity => {
                    console.log(` - Type: ${entity.type}, Salience: ${entity.salience}`);
                    if (entity.metadata && entity.metadata.wikipedia_url) {
                      console.log(` - Wikipedia URL: ${entity.metadata.wikipedia_url}$`);
                    }
                });
                return entities[0].name;
            } 
        } catch (err) {
            console.error(err);
        }
        return null
    }
}