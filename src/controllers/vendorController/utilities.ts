import fs from "fs";

export const getLogo = (host: string | undefined, vendorName: string) => {

    let imgPath:string | null
    const files = fs.readdirSync('public/logos/vendors')

    if(files.includes(`${vendorName}.png`)) {
        imgPath = `${host}/logos/vendors/${vendorName}.png`
    } else {
        imgPath = `${host}/logos/vendors/default.png`
    }

    return imgPath;
}