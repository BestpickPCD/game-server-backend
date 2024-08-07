import axios from 'axios';
import { v4 as GUIDGen } from 'uuid';

export const __bestpickGameList = async (url: string, keys: any[]) => {
  try {
    const gameUrl = `${url}:6175/games`;
    const objectKeys = await keys.reduce((acc, cur) => ({ ...acc, ...cur }), {});
    const data = await axios.get(gameUrl, {
      headers: {
        ...objectKeys
      }
    });
  
    console.log(data);
    return data;
  } catch (error) {
    console.log(error)
  }
};

export const __evolutionGameList = async (url: string, keys: any) => {
  const { apiKey } = keys;
  const data = await axios.get(`${url}:6195/api/game_list`, {
    headers: {
      'api-key': apiKey
    }
  });

  return data;
};

export const __pgsoftGameList = async (url: string, keys: any) => {
  try {
    let PGKeys: any
    if(keys && keys?.length ) {
      keys.forEach((element: any) => {
        const key = Object.keys(element);
        PGKeys = { ...{ [`${key}`]: element[`${key}`]}, ...PGKeys }
      });
    
      const { operator_token, secret_key } = PGKeys;
      const guid = GUIDGen();
      const data = await axios.post(
        `${url}/external/Game/v2/Get?trace_id=${guid}`,
        {
          operator_token,
          secret_key,
          currency: 'KRW',
          language: 'enus',
          status: 1
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      return data;
    }
  } catch (error) {
    console.log(error) 
  }
};
