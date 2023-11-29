import axios from "axios";
import { v4 as GUIDGen } from "uuid";

export const __bestpickGameList = async ( url: string, keys: any ) => {

    const { apiKey } = keys
    const data = await axios.get(`${url}:6195/api/game_list`, {
        headers: {
            'api-key': apiKey,
        }
    });

    return data;
}

export const __evolutionGameList = async ( url: string, keys: any ) => {
    
    const { apiKey } = keys
    const data = await axios.get(`${url}:6195/api/game_list`, {
        headers: {
            'api-key': apiKey,
        }
    });

    return data;
}

export const __pgsoftGameList = async ( url: string, keys: any ) => {
    
    const { operator_token, secret_key } = keys;
    const guid = GUIDGen();
    const data = await axios.post(`${url}/external/Game/v2/Get?trace_id=${guid}`, 
        {
            operator_token,
            secret_key,
            currency: 'KRW',
            language: 'enus',
            status: 1
        },
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });

    return data;
}