const obs = new OBSWebSocket();
document.getElementById("disconnect").disabled = true
isRecording = false
isStreaming = false
document.getElementById('address').value = `${location.hostname}:4444`

function streaming(isStarted) {
  const transitionElement = document.getElementById('streaming');
  if(isStarted){
    if(window.confirm('STOP STREAMING?')){
      obs.send('StopStreaming');
      transitionElement.className = 'stopped'
      transitionElement.textContent = 'Streaming: OFFLINE';
      isStreaming=!isStreaming
    }
  }else{
    if(window.confirm('START STREAMING?')){
      obs.send('StartStreaming');
      transitionElement.className = 'started'
      transitionElement.textContent = 'Streaming: ONLINE';
      isStreaming=!isStreaming
    }
  }
}

function recording(isStarted) {
  const transitionElement = document.getElementById('recording');
  if(isStarted){
    if(window.confirm('STOP RECORDING?')){
      obs.send('StopRecording');
      transitionElement.className = 'stopped'
      transitionElement.textContent = 'Recording: stop';
      isRecording=!isRecording
    }
  }else{
    if(window.confirm('START RECORDING?')){
      obs.send('StartRecording');
      transitionElement.className = 'started'
      transitionElement.textContent = 'Recording: start';
      isRecording=!isRecording
    }
  }
}

document.getElementById('connect').addEventListener('click', e => {
  const address = document.getElementById('address').value;
  const password = document.getElementById('password').value;

  obs.connect({
    address: address,
    password: password
  }).then(() => {
    document.getElementById("connect").disabled = true
    document.getElementById("disconnect").disabled = false
    obs.send('GetStudioModeStatus').then(status => {
      if(!status.studioMode) obs.send('EnableStudioMode').catch((err)=>{console.error(err)});
    })
    obs.send('GetSceneList').then(data => {
      const sceneListDiv = document.getElementById('scene_list');
      data.scenes.forEach(scene => {
        const sceneElement = document.createElement('button');
        sceneElement.textContent = scene.name;
        sceneElement.className = 'scene';
        sceneElement.onclick = function() {
          obs.send('SetPreviewScene', {
            'scene-name': scene.name
          });
        };
        sceneListDiv.appendChild(sceneElement);
      });
    }).catch((err)=>{console.log(err)});

    obs.send('GetTransitionList').then(data => {
      const transitionListDiv = document.getElementById('transition_list');
      data.transitions.forEach(transition => {
        const transitionElement = document.createElement('button');
        transitionElement.textContent = transition.name;
        transitionElement.className = 'transition';
        transitionElement.onclick = function() {
          obs.send('SetCurrentTransition', {
            'transition-name': transition.name
          });
          obs.send('TransitionToProgram', {
            'with-transition.name': transition.name
          });
        };
        transitionListDiv.appendChild(transitionElement);
      });
    }).catch((err)=>{console.log(err)});

    obs.send('GetStreamingStatus').then((data) => {
      isRecording = data.recording
      isStreaming = data.streaming
      const controller = document.getElementById('controller_list');

      if(isStreaming){
        const transitionElement = document.createElement('button');
        transitionElement.textContent = 'Streaming: ONLINE';
        transitionElement.className = 'started'
        transitionElement.id = 'streaming'
        transitionElement.onclick = function() {
          streaming(!isStreaming)
        };
        controller.appendChild(transitionElement);
      }else{
        const transitionElement = document.createElement('button');
        transitionElement.textContent = 'Streaming: OFFLINE';
        transitionElement.className = 'stopped'
        transitionElement.id = 'streaming'
        transitionElement.onclick = function() {
          streaming(isStreaming)
        };
        controller.appendChild(transitionElement);
      }

      if(isRecording){
        const transitionElement = document.createElement('button');
        transitionElement.textContent = 'Recording: start';
        transitionElement.className = 'started'
        transitionElement.id = 'recording'
        transitionElement.onclick = function() {
          recording(!isRecording)
        };
        controller.appendChild(transitionElement);
      }else{
        const transitionElement = document.createElement('button');
        transitionElement.textContent = 'Recording: stop';
        transitionElement.className = 'stopped'
        transitionElement.id = 'recording'
        transitionElement.onclick = function() {
          recording(isRecording)
        };
        controller.appendChild(transitionElement);
      }
    }).catch((err)=>{console.log(err)});

    obs.send('GetSourcesList').then((data)=>{
      data = Object.values(data.sources).filter(data => data.name.match(/(音声|マイク)/));
      while(document.getElementById('audio_list').firstChild){
        document.getElementById('audio_list').removeChild(document.getElementById('audio_list').firstChild);
      }
      const volParent = document.getElementById('audio_list')
      data.forEach(volume => {
        const volChildParent = document.createElement('div')
        const volName = document.createElement('p')
        volName.textContent = volume.name
        volChildParent.appendChild(volName)
        obs.send('GetVolume', {
          'source': volume.name
        }).then((vol) => {
          const volChild = document.createElement('input')
          volChild.type = 'range'
          volChild.min = 0
          volChild.max = 1
          volChild.step = 0.01
          volChild.value = Math.sqrt(vol.volume)
          volChild.className = ''
          volChild.onchange = function() {
            obs.send('SetVolume', {
              'source': volume.name,
              'volume': this.value ** 2
            });
          };
          volChildParent.appendChild(volChild)
        }).catch((err)=>{console.log(err)});
        obs.send('GetMute', {
          'source': volume.name
        }).then((mutes) => {
          const muteChild = document.createElement('input')
          muteChild.type = 'checkbox'
          muteChild.checked = mutes.muted
          muteChild.className = 'mute'
          muteChild.onchange = function() {
            obs.send('SetMute', {
              'source': volume.name,
              'mute': this.checked
            });
          };
          volChildParent.appendChild(muteChild)
          volParent.appendChild(volChildParent);
        }).catch((err)=>{console.log(err)});
      })
    });

  }).catch((err) => {
    console.log(err)
  });
});

document.getElementById('disconnect').addEventListener('click', e => {
  obs.disconnect()
  document.getElementById("connect").disabled = false
  document.getElementById("disconnect").disabled = true
  while(document.getElementById('scene_list').firstChild){
    document.getElementById('scene_list').removeChild(document.getElementById('scene_list').firstChild);
  }
  while(document.getElementById('transition_list').firstChild){
    document.getElementById('transition_list').removeChild(document.getElementById('transition_list').firstChild);
  }
  while(document.getElementById('controller_list').firstChild){
    document.getElementById('controller_list').removeChild(document.getElementById('controller_list').firstChild);
  }
  while(document.getElementById('audio_list').firstChild){
    document.getElementById('audio_list').removeChild(document.getElementById('audio_list').firstChild);
  }
});

setInterval(function(){
  const date = new Date(),
    time =
      ('0' + date.getHours()).slice(-2) + ':' +
      ('0' + date.getMinutes()).slice(-2) + ':' +
      ('0' + date.getSeconds()).slice(-2) + '.' +
      ('00' + date.getMilliseconds()).slice(-3);
  document.getElementById('time').textContent = time;
}, 0);