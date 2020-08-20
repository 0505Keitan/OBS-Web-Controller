const obs = new OBSWebSocket();
document.getElementById("disconnect").disabled = true
isRecording = false
isStreaming = false
document.getElementById('address').value = `${location.hostname}:4444`

function streaming(isStarted) {
  const streamingElement = document.getElementById('streaming');
  if(isStarted){
    if(window.confirm('STOP STREAMING?')){
      obs.send('StopStreaming');
      streamingElement.className = 'stopped'
      streamingElement.textContent = 'Streaming: OFFLINE';
      isStreaming=!isStreaming
    }
  }else{
    if(window.confirm('START STREAMING?')){
      obs.send('StartStreaming');
      streamingElement.className = 'started'
      streamingElement.textContent = 'Streaming: ONLINE';
      isStreaming=!isStreaming
    }
  }
}

function recording(isStarted) {
  const recordingElement = document.getElementById('recording');
  if(isStarted){
    if(window.confirm('STOP RECORDING?')){
      obs.send('StopRecording');
      recordingElement.className = 'stopped'
      recordingElement.textContent = 'Recording: stop';
      isRecording=!isRecording
    }
  }else{
    if(window.confirm('START RECORDING?')){
      obs.send('StartRecording');
      recordingElement.className = 'started'
      recordingElement.textContent = 'Recording: start';
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
      const sceneList = document.getElementById('scene_list');
      data.scenes.forEach(scene => {
        const sceneElement = document.createElement('button');
        sceneElement.textContent = scene.name;
        sceneElement.className = 'scene';
        sceneElement.onclick = function() {
          obs.send('SetPreviewScene', {
            'scene-name': scene.name
          });
        };
        sceneList.appendChild(sceneElement);
      });
    }).catch((err)=>{console.log(err)});

    obs.send('GetTransitionList').then(data => {
      const transitionList = document.getElementById('transition_list');
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
        transitionList.appendChild(transitionElement);
      });
    }).catch((err)=>{console.log(err)});

    obs.send('GetStreamingStatus').then((data) => {
      isRecording = data.recording
      isStreaming = data.streaming
      const controller = document.getElementById('controller_list');

      if(isStreaming){
        const streamingStatusElement = document.createElement('button');
        streamingStatusElement.textContent = 'Streaming: ONLINE';
        streamingStatusElement.className = 'started'
        streamingStatusElement.id = 'streaming'
        streamingStatusElement.onclick = function() {
          streaming(!isStreaming)
        };
        controller.appendChild(streamingStatusElement);
      }else{
        const streamingStatusElement = document.createElement('button');
        streamingStatusElement.textContent = 'Streaming: OFFLINE';
        streamingStatusElement.className = 'stopped'
        streamingStatusElement.id = 'streaming'
        streamingStatusElement.onclick = function() {
          streaming(isStreaming)
        };
        controller.appendChild(streamingStatusElement);
      }

      if(isRecording){
        const recordingStatusElement = document.createElement('button');
        recordingStatusElement.textContent = 'Recording: start';
        recordingStatusElement.className = 'started'
        recordingStatusElement.id = 'recording'
        recordingStatusElement.onclick = function() {
          recording(!isRecording)
        };
        controller.appendChild(recordingStatusElement);
      }else{
        const recordingStatusElement = document.createElement('button');
        recordingStatusElement.textContent = 'Recording: stop';
        recordingStatusElement.className = 'stopped'
        recordingStatusElement.id = 'recording'
        recordingStatusElement.onclick = function() {
          recording(isRecording)
        };
        controller.appendChild(recordingStatusElement);
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
    window.alert(err.error)
  });
});

document.getElementById('disconnect').addEventListener('click', e => {
  obs.disconnect()
  document.getElementById("connect").disabled = false
  document.getElementById("disconnect").disabled = true
  while(document.getElementById('scene_list').firstChild){
    document.getElementById('scene_list').removeChild(document.getElementById('scene_list').firstChild); }
  while(document.getElementById('transition_list').firstChild){
    document.getElementById('transition_list').removeChild(document.getElementById('transition_list').firstChild); }
  while(document.getElementById('controller_list').firstChild){
    document.getElementById('controller_list').removeChild(document.getElementById('controller_list').firstChild); }
  while(document.getElementById('audio_list').firstChild){
    document.getElementById('audio_list').removeChild(document.getElementById('audio_list').firstChild); }
});

setInterval(function(){
  const date = new Date()
  document.getElementById('time').textContent  =
    ('0' + date.getHours()).slice(-2) + ':' +
    ('0' + date.getMinutes()).slice(-2) + ':' +
    ('0' + date.getSeconds()).slice(-2) + '.' +
    ('00' + date.getMilliseconds()).slice(-3);
}, 0);