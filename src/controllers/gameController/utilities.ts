import axios from 'axios';
import { __bestpickGameList, __evolutionGameList, __pgsoftGameList } from './vendors.ts';

export const getGameList = async ( vendors: any[] ) => {
    let list = [] as any[] 
    await Promise.all(vendors.map( async (vendor) => {
        const { name, url, keys, agents } = vendor as any;
        const { directUrl } = agents[0];

        // If directUrl but no url - call through honorlink
        if(directUrl && url) {
            const gameList = await _getDirectURL(url, keys, name);
            const arrangedData = await _rearrangeData(gameList.data.data, name, directUrl);
            list = list.concat(arrangedData);
        } else {
            const gameList = await axios.get(`${process.env.HONORLINK_URL}/api/game-list?vendor=${name}`,{
                headers: {
                    Authorization: `Bearer ${process.env.HONORLINK_AGENT_KEY}`
                }
            }) as any;
            const arrangedData = await _rearrangeData(gameList.data, name, directUrl);
            list = list.concat(arrangedData);
        }

    })); 
    return list;
}

const _getDirectURL = async (url: string, keys: any, name: string) => {
 
    let data
    switch (name) {
        case "Bestpick":
            data = await __bestpickGameList(url, keys);
            break;
        case "PG Soft":
            data = await __pgsoftGameList(url, keys);
            break
        default: {
                const { apiKey } = keys;
                data = await axios.get(`${url}:6195/api/game_list`, {
                    headers: {
                        'api-key': apiKey,
                    }
                });
            }
            break;
    }

    return data

}

const _rearrangeData = async (data:any[], vendorName: string | null, directUrl: boolean) => {

    return data.map((datum) => ({
        id: datum.id ?? datum.game_id ?? datum.gameId ?? null,
        name: datum.game_name ?? datum.title ?? datum.name ?? datum.gameName ?? null,
        code: datum.gameCode ?? datum.code ?? datum['game-code'] ?? datum.game_code ?? null,
        provider: directUrl ? vendorName : 'Honorlink',
        type: datum.type ?? null,
        vendor: datum.vendor ?? vendorName,
        img: datum.thumbnail ?? datum.img_path ?? null,
    }))

}
