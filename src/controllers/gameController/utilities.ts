import axios from 'axios';

export const getGameList = async ( vendors: any[] ) => {
    let list = [] as any[] 
    await Promise.all(vendors.map( async (vendor) => {
        const { name, url, apiKey, agents } = vendor as any;
        const { directUrl } = agents[0]; 
        if(directUrl) {
            const gameList = await _getDirectURL(url, apiKey, name);
            const arrangedData = await _rearrangeData(gameList.data.data)
            list = list.concat(arrangedData);
        } else {
            const gameList = await axios.get(`${process.env.HONORLINK_URL}/api/game-list?vendor=${name}`,{
                headers: {
                    'Authorization': `Bearer ${process.env.HONORLINK_AGENT_KEY}`
                }
            }) as any;
            console.log(gameList.data)
            const arrangedData = await _rearrangeData(gameList.data)
            list = list.concat(arrangedData);
        }

    })); 
    return list;
}

const _getDirectURL = async (url: string, apiKey: string, name: string) => {

    const data = await axios.get(`${url}:6195/api/game_list`, {
        headers: {
            'api-key': apiKey,
        }
    });

    return data

}

const _rearrangeData = async (data:any[]) => {

    return data.map((datum) => ({
        id: datum.id ?? datum.game_id ?? null,
        name: datum.game_name ?? datum.title ?? datum.name ?? null,
        type: datum.type ?? null,
        vendor: datum.vendor ?? null,
        img: datum.thumbnail ?? datum.img_path ?? null,
    }))

}
