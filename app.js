function Pad(options){
    this.id = options.id;
    this.key = options.key || null;
    this.buffer = options.buffer || null;
    this.volume = options.volume || 1;
    this.$el = $("#" + this.id);
}

var app = {
    context: new (window.AudioContext || window.webkitAudioContext)(),
    editMode: false,
    padBeingEdited: null,
    loadSource: function (raw, padId) {
        var that = this;
        this.context.decodeAudioData(raw, function (buffer) {
            if (!buffer) {
                console.error("failed to decode:", "buffer null");
                return;
            }
            that.soundbank.find(padId).buffer = buffer;
            console.log("started...");
            //TODO: when file finished being read, set flag on pad 
        }, function (error) {
            console.error("failed to decode:", error);
        });
    },
    onfilechange: function (then, evt) {
        var that = this;        
        if(this.padBeingEdited){
            var files = evt.target.files; // FileList object
            var selFile = files[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                then.bind(that,e.target.result, that.padBeingEdited)();
            };
            reader.onerror = function (e) {
                console.error(e);
            };
            reader.readAsArrayBuffer(selFile);
        }
    },
    soundbank : {
        pads: [ new Pad({id: "pad1", key: "a"}),
                new Pad({id: "pad2", key: "z"}),
                new Pad({id: "pad3", key: "e"}),
                new Pad({id: "pad4", key: "q"}),
                new Pad({id: "pad5", key: "s"}),
                new Pad({id: "pad6", key: "d"})],
        find: function(padId){
            return _.findWhere(this.pads, { id: padId});
        },
        findByKey: function(keyname){
            return _.findWhere(this.pads, { key: keyname});
        },
        play: function(padId){
            var pad = this.find(padId);
            console.log(pad);
            if(pad && pad.buffer){
                var source = app.context.createBufferSource();
                source.buffer = pad.buffer;
                var gainNode = app.context.createGain();
                gainNode.gain.value = pad.volume;
                source.connect(gainNode);
                gainNode.connect(app.context.destination);
                source.start(0);
            }
        }
    },
    triggerButton: function(button) {
        button.velocity({
            backgroundColor: '#FFDD00',
            scale: 0.85
        },
        {
            duration: 75,
            easing: "easeInSine"
        })
        .velocity("reverse");
        this.soundbank.play(button.attr('id'));
    },
    clickPad: function(e){
        var button = $(e.currentTarget);
        if(!this.editMode){
            this.triggerButton(button);
            this.padBeingEdited = null;
        }
        else{
            $(".pad.edited").removeClass("edited");
            this.padBeingEdited = button.attr("id");
            console.log( this.padBeingEdited);
            button.addClass("edited");
            $("#volume").val(this.soundbank.find(this.padBeingEdited).volume *100).trigger('change');
            $("#key-chooser").text(this.soundbank.find(this.padBeingEdited).key);
            $(".edit-control").show();
        }
    },
    changeEditMode: function(e){
        var editButton = $(e.currentTarget);
        $(".pad.edited").removeClass("edited");
        this.editMode = !this.editMode;
        if(this.editMode){
            editButton.addClass("active"); 
        }
        else{
            editButton.removeClass("active");
            $(".edit-control").hide();
        }   
    },
    updateVolume: function(v){
        this.soundbank.find(this.padBeingEdited).volume = Number(v) / 100;
    },
    keypress: function(e){
        var keyName = String.fromCharCode(e.which).toLowerCase();
        var pad = this.soundbank.findByKey(keyName);
        this.triggerButton(pad.$el);   
    },
    initHandlers: function(){
        document.getElementById('file').addEventListener('change', this.onfilechange.bind(this, this.loadSource), false);
        $("#pads").on("click", "div.pad", this.clickPad.bind(this));
        
         $("#volume").knob({
            'change' : this.updateVolume.bind(this)
             });    
        
        
        $("#nav").on("click", "#edit", this.changeEditMode.bind(this));
        
        $(document).keydown(this.keypress.bind(this));
    },
    initialize: function(){
         this.initHandlers();   
    }
};

app.initialize();



