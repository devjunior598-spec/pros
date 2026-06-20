const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processFiles() {
    const dirs = [
        path.join(__dirname, '../app'),
        path.join(__dirname, '../components')
    ];

    dirs.forEach(dir => {
        walkDir(dir, function (filePath) {
            if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

            let content = fs.readFileSync(filePath, 'utf8');
            let originalContent = content;

            content = content.replace(/if\s*\(\s*(error|err)[\?\.]*name\s*===\s*'AbortError'\s*\|\|\s*(error|err)[\?\.]*message\s*===\s*'Fetch is aborted'\s*\)/g,
                "if ($1?.name === 'AbortError' || $1?.message?.includes('aborted') || $1?.message?.includes('AbortError'))");

            content = content.replace(/if\s*\(\s*(error|err)[\?\.]*name\s*===\s*'AbortError'\s*\|\|\s*(error|err)[\?\.]*message\s*===\s*'Fetch is aborted'\s*\|\|\s*controller\.signal\.aborted\s*\)/g,
                "if ($1?.name === 'AbortError' || $1?.message?.includes('aborted') || $1?.message?.includes('AbortError') || controller?.signal?.aborted)");

            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated ${filePath}`);
            }
        });
    });
}

processFiles();
