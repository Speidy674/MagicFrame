const framesContainer = document.querySelector('#framesContainer')

async function loadFrames() {
    framesContainer.innerHTML = "";
    try {
        const response = await (await fetch("/api/frames")).json()
        for(const frame of response.frames){
            if(!frame.frame.init) continue;
            let frameItemTemplate = document.querySelector("#frameItem").innerHTML;
            console.log(frame.frame.file ? frame.frame.file.typ == "vid" ? true : false : false);
            let frameItemRender = Mustache.render(frameItemTemplate, {
                src: frame.frame.file ? "/data/"+frame.frame.file.id : "",
                isVid: frame.frame.file ? frame.frame.file.type == "vid" ? true : false : false,
                id: frame.frame.id,
                height: frame.frame.height,
                width: frame.frame.width,
                fileName: frame.frame.file?.name,
                testing: frame.frame.testing
            });
            
            framesContainer.innerHTML += frameItemRender;
        }
    } catch (e) {
        console.log(e)
    }    
}
loadFrames();