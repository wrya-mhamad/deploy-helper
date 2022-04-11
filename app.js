var fs = require('fs');
const { spawn } = require('child_process');
var path = require('path');
// In newer Node.js versions where process is already global this isn't necessary.
var process = require("process");
require('dotenv').config()

const frontDestination = process.env.FRONT_DESTINATION;
const backDestination =  process.env.BACK_DESTINATION;
const apiDestination =   process.env.API_DESTINATION;
const domain = process.env.DOMAIN;
let data, data2;


 const main = async () => {
    
    try{
        console.log(domain);
        const frontFiles =  await fs.promises.readdir(apiDestination)
        await frontFiles.forEach(file => {
            if (file !== 'Back' && file !== 'Icons' && file !== 'Images' && file !== 'Test') {
                fs.promises.rm(path.join(apiDestination, file), { recursive: true, force: true });
            }
        });

        const backFiles =  await fs.promises.readdir(apiDestination + '\\Back')
         await backFiles.forEach(async file => {
                fs.promises.rm(path.join(apiDestination+ '\\Back', file),{ recursive: true, force: true });
        });
        
        changeLink(new RegExp('https://localhost:44351', 'g'), domain);

        const  buildFront =spawn('npm run build', {stdio: 'inherit',shell: true,cwd: frontDestination})
        buildFront.on('close', () => {
            const buildBack =spawn('npm run build', {stdio: 'inherit',shell: true,cwd: backDestination})
            buildBack.on('close', () => {
                console.log('succefully built the front and back');
                const frontFiles = fs.readdirSync(frontDestination + '\\dist');
                console.log(frontFiles);
                frontFiles.forEach(file => {
                    try {
                        fs.renameSync(frontDestination + '\\dist\\' + file, apiDestination+'\\' + file);
                    } catch (error) {
                        console.log(error);
                    }
                });
                
                const backFiles = fs.readdirSync(backDestination + '\\dist');
                console.log(backFiles);
                backFiles.forEach(file => {
                    try {
                        fs.renameSync(backDestination + '\\dist\\' + file, apiDestination+'\\Back\\' + file);
                    } catch (error) {
                        console.log(error);
                    }
                });
                var index = fs.readFileSync(apiDestination + '\\Back\\index.html', 'utf8')
                // replace '=/' with '='
                index = index.replace(/\=\//g, '=');
                fs.writeFileSync(apiDestination + '\\Back\\index.html', index, 'utf8');
                changeLink(new RegExp(domain, 'g'), 'https://localhost:44351')
            })
        })
        
        
        
    }catch(err){
        console.log(err)
    }
}

const changeLink = async (link1, link2) => {
    try{
        data = fs.readFileSync(frontDestination + '\\src\\main.js', 'utf8')
        data2 = fs.readFileSync(backDestination + '\\src\\main.js', 'utf8')
       
        data = data.replace(link1, link2);
        data2 = data2.replace(link1, link2);
        fs.writeFileSync(frontDestination + '\\src\\main.js', data, 'utf8');
        fs.writeFileSync(backDestination + '\\src\\main.js', data2, 'utf8');
    }catch(err){
        console.log(err)
    }
}

main()