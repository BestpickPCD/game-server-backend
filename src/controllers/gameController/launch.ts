import axios from 'axios';
import { v4 as GUIDGen } from 'uuid';

interface GameLaunch {
  gameId: string;
  vendor: string;
  username: string;
  nickname: string | null;
  ipAddress: string;
}

export const __evolutionGameLaunch = async (data: GameLaunch) => {
  const { gameId, vendor, username, nickname } = data;

  const nicknameFilter: string = nickname ? `&nickname=${nickname}` : '';
  const { data: list } = await axios.get(
    `${process.env.HONORLINK_URL}/api/game-launch-link?username=${username}${nicknameFilter}&game_id=${gameId}&vendor=${vendor}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.HONORLINK_AGENT_KEY}`
      }
    }
  );

  return list;
};

export const __pgsoftGameLaunch = async (data: GameLaunch) => {
  const { gameId, username, nickname, ipAddress } = data;
  const operatorToken = '49f127e31e0d9200b4f71502d33f45a4';
  const guid = GUIDGen();

  const response = await axios.post(
    `https://api.pg-bo.me/external-game-launcher/api/v1/GetLaunchURLHTML?trace_id=${guid}`,
    {
      operator_token: operatorToken,
      path: `/${gameId}/index.html`,
      extra_args: `?btt=1&ops=${operatorToken}`,
      url_type: 'game-entry',
      client_ip: ipAddress
    },
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  return {
    user: {
      username,
      nickname
    },
    html: response.data
  };
};

export const __bestpickGameLaunch = async (data: GameLaunch) => {
  try {
    const { gameId, username, nickname } = data;
    const response: any = await axios.post(
      'http://192.168.2.15:6175/v1/game/open',
      // 'http://172.104.190.6:6175/v1/game/open',
      {
        game_id: gameId,
        user_id: username,
        ag_code: 'A01',
        currency: 'usd',
        language: 'en',
        cash: 1000
      },
      {
        headers: {
          'ag-token':
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ImNyeXB0byIsImlhdCI6MTUxNjIzOTAyMn0.ZAGAuEn3ifbPB37oVc1NtqcgQAo6xOu_MLXqN6smdro',
          'ag-code': 'A01'
        }
      }
    );

    const { user_id, cash, game_id, status, url: link } = response.data;
    return {
      user: {
        id: user_id,
        username,
        nickname,
        balance: cash
      },
      link
    };
  } catch (error) {
    console.log(error);
  }
};
