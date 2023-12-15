import axios from "axios";

interface GameLaunch {
  gameId:string,
  vendor:string,
  username:string,
  nickname:string | null
}

export const __evolutionGameLaunch = async (data: GameLaunch) => {

  const { gameId, vendor, username, nickname } = data
  
  const nicknameFilter: string = nickname ? `&nickname=${nickname}` : ''; 
  const { data: list } = await axios.get(`${process.env.HONORLINK_URL}/api/game-launch-link?username=${username}${nicknameFilter}&game_id=${gameId}&vendor=${vendor}`,{
      headers: {
          Authorization: `Bearer ${process.env.HONORLINK_AGENT_KEY}`
      }
  }); 

  return list 
    
}

export const __pgsoftGameLaunch = async (data: GameLaunch) => {
  
  

}

export const __bestpickGameLaunch = async (data: GameLaunch) => {

    const { gameId, vendor, username, nickname } = data
    const url = 'http://157.230.251.158:6175/v1/game/open';

    const response: any = await axios.post(
      url,
      {
        game_id: gameId,
        user_id: 'dev2',
        ag_code: 'dev2',
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
    const { user_id, cash, game_id, status, url: link } = response.data
    
    return {
      user: {
        id: user_id ,
        username,
        nickname,
        balance: cash,
      },
      link
    }

}