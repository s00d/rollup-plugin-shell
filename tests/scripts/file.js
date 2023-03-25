const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, '../out');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

fs.writeFileSync(path.join(dir, 'test.txt'), 'Hey there!');
process.exit(0);
