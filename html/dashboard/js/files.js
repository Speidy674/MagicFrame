const framesContainer = document.querySelector('#filesContainer')

let page = 1;

async function loadFiles() {
    framesContainer.innerHTML = "";
    try {
        const response = await (await fetch("/api/files?page=" + page)).json()

        document.querySelector("span#fileCount").innerHTML = response.total

        for (const file of response.files) {
            console.log(file)
            let itemTemplate = document.querySelector("#fileItem").innerHTML;
            let itemRender = Mustache.render(itemTemplate, {
                src: "/data/" + file.id,
                isVid: file.type == "vid" ? true : false,
                id: file.id,
                fileName: file.name,
                fileType: file.type,
                fileFolder: file.folder.join("/")
            });

            framesContainer.innerHTML += itemRender;
        }

        document.querySelector("span#filesCurrentPage").innerHTML = response.page
        document.querySelector("span#filesTotalPage").innerHTML = response.pages
    } catch (e) {
        console.log(e)
    }
}

function prevFilesPage() {
    page--
    if (page < 1) {
        page = 1
    }
    loadFiles();
}

function nextFilesPage() {
    page++;
    loadFiles();
}

loadFiles();