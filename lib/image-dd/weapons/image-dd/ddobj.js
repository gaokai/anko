/**
  * yumen t=20120526
  */

/**
  * ������ק
  */
KISSY.add('weapons/image-dd/ddobj', function(S, Template, Anim, PC){
    var D = S.DOM, E = S.Event, $ = S.all;
    
    var WHEEL_STEP = 1 //����м��������δ�����Ϊ
    ,WHEEL_PIX = 50 //һ����������ֵ
    ,SHOW_DOWN = 0 //�����˶��ļ��ٶȴ�С
    ,MOUSE_MOVE_AUTO_CLOSE_TIMER = 5000 // ����ھ��� �趨��ʱ����û�з���move����Ϊ���߼���ת��mouseup
    ,DEGRADATION = 5 //���������move�¼�����Ƶ�ʣ�
    ;
    
    var POPUP_HD_TPL = '<div class="box-hd hidden close-rt-wrap" ><a href="#" title="���˳�����Ҳ���Թر�Ŷ" class="close-rt J_Close" id="J_CloseImageDD"></a></div>'
    
    ,POPUP_BD_TPL = '<div class="box-bd"></div>'
    
    ,POPUP_IMG = '<img title="�����ֿ��ԷŴ�ͼƬ" class="G_K" style="width:{{showWidth}}px;left:{{left}}px;top:{{top}}px;" src="{{imgSrc}}"  />'
    
    ,POPUP_BT_TPL = '<div class="box-bt"></div>'
    ;
    
    var POPUP_TPL = 
    '<div class="img-dd-popup">\
       <div class="img-dd-opacity-bg"></div>\
        <div class="img-dd-box">'
            + POPUP_BD_TPL 
            + POPUP_BT_TPL
        + '</div>\
    </div>';
    
    var POPUP_IFRAME_TPL = '<iframe class="ie-popup-mask hidden"></iframe>';
   
    var CFG = {
        ele: []
    };
    
    /**
      * @param{HTMLIMGElement} һ��img��ǩ���������
      */
    function DDObj(ele){
        var self = this;
        self.config = CFG;
        self.inited = false;//��Ƭ�Ƿ��ʼ����
        self.popup = null; //ȫ����������
        self.activeImg = null;//��ǰ��Ծ��img��ǩ
        self.activeImgPos = {left:0,top:0}; //mousedownʱͼƬ����λ��
        self.mousedownCoo = {}; //���mousedownλ�õ�����
        self.anim = null;//���ֿ��ƷŴ���С�Ķ���
        self.initAnim = null;//��ʼ����λͼƬ����
        self.bigImgObj = new Image();//��ͼimg����
        self.initWidth = 0;
        self.defaultMaxWidth = 10000;//ͼƬ�Ŵ������
        self.defaultMinWidth = 50; //ͼƬ��С����С���
        
        self.dragInfoX = []; //��קͼƬ�������¼
        self.dragInfoY = [];
        self.dragInfoTime = []; //��ק������ʱ���¼
        self.autoSlideAnim = null; //Anim obj
        
        S.mix(self.config, {
            ele: (ele)?(S.isArray(ele)?(ele):([ele])):([])
        });
        self._init();
    }
    
    var o = {
        _init: function(){
            var self = this, cfg = self.config;
            
            //��ʼ�� new ����ʱ��
            S.each(cfg.ele, function(item){
                self._bindEvent(item);
            });
        }
                
        ,get: function(key){
            return this[key];
        }
        
        ,set: function(key, value){
            this[key] = value;
            return value;
        }
        
        ,add: function(ele, className){
            var self = this, cfg = self.config;
            
            if(S.isArray(ele) ){
                cfg.ele = cfg.ele.concate(ele);
                S.each(ele, function(item){
                    self._bindEvent(item, className);
                });
            }
            else{
                cfg.ele.push(ele);
                self._bindEvent(ele, className);
            }
            // console.log(cfg.ele)
        }
        
        //��add������img �� img��������ע��click�¼�
        ,_bindEvent: function(ele, className){
            var self = this, cfg = self.config;
            
            if(ele == null){return false;}
            
            //close
            //mouse down
            E.on(ele, 'click', function(e){
                var target = e.target;
                if(target.tagName.toUpperCase() != 'IMG'){
                    return ;
                }
                if(className && !D.hasClass(target, className) ){
                    return ;
                }
                
                if(target.className == 'G_K'){
                    return ;
                }
                
                e.halt();
                //click img tag
                if( self.get('inited') != true ){
                    //��ʼ����Ƭ
                    self._createPopup();
                    self._initHTMLElement();
                    self._bindPopupMousedown();
                    self.set('inited', true);
                }
                
                if(S.UA && S.UA.ie && S.UA.ie == 6){
                    //insert a iframe mask
                }
                
                self._showPopupImg(target.getAttribute('data-original-url'),  target.getAttribute('src') );
                D.show(self.get('popup'));
                
                D.show(self.ieIframeMask);
                D.show(self.get('closeBtn'));
            });
            
            //mouse move   add: move settime close action
            //mouse up
        }
        
        //��ʼ����ʾͼƬ��ͼ
        ,_showPopupImg: function(srcUrl, srcUrlThunmb){
            var self = this
            ,clientHeight = document.body.clientHeight || document.documentElement.clientHeight
            ,clientWidth  = document.body.clientWidth  || doucment.doucmentElement.clientWidth
            ;
            
            //��ӵ�ǰͼƬ
            self.popupBd.innerHTML = Template(POPUP_IMG).render({
                imgSrc: srcUrlThunmb//��ʼ����ʾСͼ
                ,imgAlt: 'ͼƬ��ͼ'
                ,showWidth: parseInt(clientWidth/2,10)
                ,left: parseInt(clientWidth/4,10) //��ͼƬ��ʾ�����м�
                ,top: 0
            });
            
            //------------------------------------------------------------------��ʼ��һЩ����
            self.popup.style.height = (document.body.scrollHeight || document.documentElement.scrollHeight) + 'px';
            self.popup.style.width  = (document.body.scrollWidth || document.documentElement.scrollWidth) + 'px';
            self.set('initWidth', parseInt(clientWidth/2,10));//��ʼ��ͼƬ��ʾ�Ŀ��
            
            self.cleanRecords(true);
            
            self.set('activeImg', D.get('IMG', self.popupBd) );//��ȡ�²����ͼƬ��DOM����
            
            //����ͼƬ�����ڿɼ�����
            self.initAnim && self.initAnim.stop(false);
            self.initAnim = new Anim(self.get('activeImg'), {
                top: (document.body.scrollTop || document.documentElement.scrollTop) + 30 + 'px'
            },1,'easeOutStrong').run();
            
            //��ͼ���غú� ��ʾ��ͼ
            self.bigImgObj.onload = null;
            if( srcUrl || srcUrl != ''){
                self.bigImgObj = null;
                self.bigImgObj = new Image();
                self.bigImgObj.onload = function(){
                    self.get('activeImg').src = srcUrl;
                }
                
            };
            self.bigImgObj.src = srcUrl;
            
            //ע������м������¼�
            self.registerWheelEvent();
            
        }
        
        //registerWheelScroll
        ,registerWheelEvent: function(){
            E.on(document, 'DOMMouseScroll', wheelScroll, this);
            E.on(document, 'mousewheel', wheelScroll, this);
            E.on(document, 'keyup', this.closePopup, this);
        }
        
        ,cancelWheelEvent: function(){
            E.remove(document, 'DOMMouseScroll', wheelScroll, this);
            E.remove(document, 'mousewheel', wheelScroll, this);
            E.remove(document, 'keyup', this.closePopup, this);
        }
        
        //regist event
        ,registerEvent: function(){
            var self = this;
            E.on(document, 'mouseup', mouseup, self);
            E.on(document, 'mousemove', move, self);
        }
        //cancel event
        ,cancelEvent: function(){
            var self = this;
            E.remove(document, 'mouseup', mouseup, self);
            E.remove(document, 'mousemove', move, self);
        }
        
        //ȫ���ɰ� execute just one time
        ,_createPopup: function(){
            var self = this, cfg = self.config;
            self.popup = D.create( POPUP_TPL );
            self.closeBtn = D.create( POPUP_HD_TPL );
            if(S.UA.ie && S.UA.ie == 6){
                self.ieIframeMask = D.create( POPUP_IFRAME_TPL );
                self.ieIframeMask.style.width = document.documentElement.scrollWidth + 'px';
                self.ieIframeMask.style.height = document.documentElement.scrollHeight + 'px';
                document.body.appendChild(self.ieIframeMask);
            }
            document.body.appendChild(self.popup);
            document.body.appendChild(self.closeBtn);
        }
        
        //������mousedown�¼��� execute just one time , event will never cancel
        ,_bindPopupMousedown: function(){
            var self = this, cfg = self.config;
            // E.on(self.popup,"dragstart",function(e){
                // e.preventDefault();
            // });
            E.on(self.popup, 'mousedown', function(e){
                var target = e.target;
                if( target.tagName.toUpperCase() != 'IMG'){
                    return ;
                }
                e.halt();
                
                //ֹͣ��ʼ���Ķ�λ����
                self.initAnim && self.initAnim.stop(false);
                self.initAnim = null;
                
                //��ʼ����ק��Ϣ
                self.cleanRecords(true);
                
                self.dragInfoX.push(getCurrentStyle(target, 'left')); //��קͼƬ�������¼
                self.dragInfoY.push(getCurrentStyle(target, 'top'));
                self.dragInfoTime.push(new Date().getTime()); //��ק������ʱ���¼
                
                
                self.set( 'activeImg', target);
                
                self.set('mousedownCoo', getMouseCoo(e) );
                self.set('activeImgPos',{
                    left: getCurrentStyle(target, 'left')
                    ,top: getCurrentStyle(target, 'top')
                });
                
                //ȡ���ı�ѡ��
                ( document.selection&&document.selection.empty&&document.selection.empty() ) || ( window.getSelection&&window.getSelection().removeAllRanges() );
                
                // console.log(self.get('activeImgPos'));
                self.registerEvent();
            });
            
            E.on(self.closeBtn, 'click', function(e){
                //close
                // if( D.hasClass(e.target, 'J_Close') ){
                    e.halt();
                    self.closePopup();
                // }
            });
            
            E.on(self.popup, 'click', function(e){
                if(S.UA.ie && S.UA.ie == 6){
                    if( D.hasClass( e.target, 'img-dd-opacity-bg')){
                        e.halt();
                        self.closePopup();
                    }
                }
            });
            // E.on(self.popup, 'dblclick',function(e){
                // self.closePopup();
            // });
            
            
            return true;
        }
        
        //������������� ��hd��bd��bt������
        ,_initHTMLElement: function(){
            var self = this;
            self.popupOpacityBg = D.get('.img-dd-opacity-bg', self.popup);
            self.popupBox = D.get('.img-dd-box', self.popup);
            self.popupHd = D.get('.box-hd', self.popup);
            self.popupBd = D.get('.box-bd', self.popup);
            self.popupBt = D.get('.box-bt', self.popup);
        }
        
        
        //���ߣ� ������ק�����м�¼�� x��y��time ���� ��קmouseup��Ļ���Ч��
        ,afterUserDrag_MyShowTime: function(){
            var self = this;
            // self.dragInfoX = []; //��קͼƬ�������¼
            // self.dragInfoY = [];
            // self.dragInfoTime = []; //��ק������ʱ���¼
            var len = self.dragInfoX.length;
            
            if(true || len < 3){
                //��ֱ��
                self.slide_straightLine();
                return false;
            }
            else{
                //��һ��ԲȦ
                var x1 = self.dragInfoX[len-3], y1 = self.dragInfoY[len-3]
                ,x2 = self.dragInfoX[len-2], y2 = self.dragInfoY[len-2]
                ,x3 = self.dragInfoX[len-1], y3 = self.dragInfoY[len-1]
                ;
                
                // log( PC.getNextPoint(x1,y1,x2,y2,x3,y3 ,1/6) );   
            }
        }
        
        //ʹ��kissy anim��һ��ֱ��
        ,slide_straightLine: function(){
            var self = this;
            
            //�������
            var x,y;
                                   
            //������ٶ�
            var len = self.dragInfoTime.length, t = 1, ts = 1//ts�ٶ�������
            ,dt = self.dragInfoTime[len-(++t)]-self.dragInfoTime[len-(++t)]//��һ���ٶ�����
            ,ldt = (self.dragInfoTime[len-1]-self.dragInfoTime[len-2])
            ,vnx = (self.dragInfoX[len-1]-self.dragInfoX[len-2])/ldt
            ,vny = (self.dragInfoY[len-1]-self.dragInfoY[len-2])/ldt
            vdx = 0 , vdy = 0;
            
            //����ٶ� ���ȡ�����������
            //���������ק������ʱ��ȽϾ�Զ���ж�ΪԶ����ק����Ӱ���Զ�����
            while(t < 4 && self.dragInfoTime[len-t] && self.dragInfoTime[len-1] - self.dragInfoTime[len-t] > 1000){
                dt += self.dragInfoTime[len-t+1]-self.dragInfoTime[len-t];
                vdx = (self.dragInfoX[len-t+1]-self.dragInfoX[len-t])/dt,
                vdy = (self.dragInfoY[len-t+1]-self.dragInfoY[len-t])/dt;
                ++t;++ts;
            }
            
            //����ĩ�ٶȡ������ڶ�ĩ�ٶȡ����ٶ�
            var accx = (vnx - vdx)/ldt
            ,accy = (vny - vdy)/ldt
            ,acct = Math.abs(vnx/accx)//�����˶�ʱ��
            
            ;
            
            // accx = 0 - Math.abs(accx);
            // accy = 0 - Math.abs(accy);
            var new_left, new_top;
            if(Math.abs(self.dragInfoX[len-1] - self.dragInfoX[len-2]) < 2){
                //��ֱY�᷽��
                new_left = self.dragInfoX[len-1];
                new_top  = (self.dragInfoY[len-1] > self.dragInfoY[len-2])?(self.dragInfoY[len-1] + 50):(self.dragInfoY[len-1] - 50);
                // log(1);
                // log(new_left + ',' + new_top)
            }
            else{
                // log(2);
                new_left = self.dragInfoX[len-1]*2 - self.dragInfoX[len-2];
                new_top  = self.dragInfoY[len-1]*2 - self.dragInfoY[len-2];
                // log(new_left + ',' + new_top)
            }
            // log(acct)
            self.autoSlideAnim =  new Anim(self.get('activeImg'),{
                left: parseInt(new_left * 1000,10)/1000 + 'px'
                ,top: parseInt(new_top * 1000,10)/1000 + 'px'
            },acct/1000*10,'easeOutStrong').run();
            
        }
        
        //������ק��¼����  ��ֹ��ס����ʱ�����������޴�����
        ,cleanRecords: function(clearAll){
            var self = this;
            self.dragInfoX = []; //��קͼƬ�������¼
            self.dragInfoY = [];
            self.dragInfoTime = []; //��ק������ʱ���¼
            self.autoSlideAnim && self.autoSlideAnim.isRunning&&self.autoSlideAnim.stop(false);
        }
        
        ,closePopup: function(e){
            if(e != undefined && (e instanceof KISSY.EventObject ) ){
                var keyCode = e.keyCode || e.charCode;
                if( e.altKey || keyCode != 27){
                    return false;
                }
            }
            var self = this, cfg = self.config;
            self.get('popup').style.display = 'none';
            self.set('activeImg', null);
            self.cancelWheelEvent();
            self.cancelEvent();
            D.hide(self.closeBtn);
            D.hide(self.ieIframeMask);
        }
        
        ,destory: function(){
            //todo
        }
        
    };
    
    // binded in document
    var moveCtlTimer = DEGRADATION;
    function move(e){
        e.halt();
        
        
        if(moveCtlTimer < DEGRADATION){//������
            ++moveCtlTimer;
            return false;
        }
        moveCtlTimer = 0;
        var self = this;
        
        var currentMouseCoo = getMouseCoo(e);//��ǰ�����������
        
        
        // console.log(currentMouseCoo);
        var distance = {
            left: currentMouseCoo.x - self.get('mousedownCoo').x
            ,top: currentMouseCoo.y - self.get('mousedownCoo').y
        };
        var new_top = parseInt(self.get('activeImgPos').top,10) + distance.top
        ,new_left = parseInt(self.get('activeImgPos').left,10) + distance.left
        ;
        
        //��¼��ק����Ϣ
        // log(++window.rcount + ':' + S.JSON.stringify(getMouseCoo(e)) + ';timer:' + new Date().getTime());
        // log(self.dragInfoTime[self.dragInfoTime.length-2] && (self.dragInfoTime[self.dragInfoTime.length-1]-self.dragInfoTime[self.dragInfoTime.length-2]) ) ;
        self.dragInfoX.push(new_left); //��קͼƬ�������¼
        self.dragInfoY.push(new_top);
        self.dragInfoTime.push(new Date().getTime()); //��ק������ʱ���¼
        // self.autoSlideAnim = null; //Anim obj
        
        
        D.css(self.get('activeImg'), 'top', new_top + 'px');
        D.css(self.get('activeImg'), 'left', new_left + 'px');
    }
      
    
    //wheel scroll
    var wheelCtlTimer = WHEEL_STEP
    ,currentAction = '';
    
    function wheelScrollReady(e){
        
    }
    
    function wheelScroll(e){
        e.halt();
        if(wheelCtlTimer < WHEEL_STEP){
            ++wheelCtlTimer;
            return false;
        }
        wheelCtlTimer = 0;
        
        var self = this;
        //��ռ��ٻ�������
        self.cleanRecords();
        
        var action = '';
        
        //��¼ �Ŵ� | Ҫ��С
        if(e.wheelDelta){action = (e.wheelDelta == 120)?('zoom'):('shrunk');}
        else if( e.detail){action = (e.detail == -3)?('zoom'):('shrunk');}
        if(action == '')return false;
        //������Ϊ��currentAction��¼����
        if(action != currentAction){currentAction = action;return false;}
                
        //ͼƬ��ǰ ���
        var activeImgSize = {
            width: getCurrentStyle(self.get('activeImg'), 'width')
            ,height: getCurrentStyle(self.get('activeImg'), 'height')
        };
        
        //ͼƬ�ĳߴ絽������ �� ����
        if( (action == 'shrunk' && activeImgSize.width < self.get('defaultMinWidth')) 
            || ( action == 'zoom' && activeImgSize.width > self.get('defaultMaxWidth') ) ){
            return false;
        }
        
        //------------------------------------------------------------------��ʼ����ͼƬ���
        //��ǰ�������λ��
        var mouseCoo = getMouseCoo(e);
        //��ǰͼƬ��ƫ��λ��(���body)
        var activeImgCoo = eleCoo(self.get('activeImg'));
        
        //��ǰͼƬ��ƫ��λ�� (���offsetParent)
        var activeImgOffset = {
            left: getCurrentStyle(self.get('activeImg'),'left')
            ,top: getCurrentStyle(self.get('activeImg'),'top')
        }

        var new_left = activeImgOffset.left
        ,new_top = activeImgOffset.top
        ,new_width = activeImgSize.width 
        ,additionWidth = WHEEL_PIX * 3 * (activeImgSize.width/self.get('initWidth'))
        ,additionHeight = additionWidth * (activeImgSize.height/activeImgSize.width)
        ;
        //����Ƿ�����ͼƬ��
        if( mouseCoo.x >= activeImgCoo.x && mouseCoo.x <= (activeImgCoo.x + activeImgSize.width)
            && mouseCoo.y >= activeImgCoo.y && mouseCoo.y <= (activeImgCoo.y + activeImgSize.height) ){//����������
            var ratio = 1, ratioX = 1, ratioY = 1;
            ratioX = (mouseCoo.x - activeImgCoo.x)/(activeImgSize.width);
            ratioY = (mouseCoo.y - activeImgCoo.y)/(activeImgSize.height);
            if(action == 'shrunk'){//��С
                new_left += additionWidth*ratioX;
                new_top  += additionHeight*ratioY;
            }
            else{//�Ŵ�
                new_left -= additionWidth*ratioX;
                new_top  -= additionHeight*ratioY;
            }
        }
        else{//��������
            var ratio = 0.5;
            if(action == 'shrunk'){
                new_left += additionWidth*ratio;
                new_top  += additionHeight*ratio;
            }
            else{
                new_left -= additionWidth*ratio;
                new_top  -= additionHeight*ratio;
            }
        }
        
        if( action == 'shrunk'){
            new_width -= additionWidth;
        }
        else{
            new_width += additionWidth;
        }
        // log(new_left + ',' + new_top)
        self.anim&&self.anim.isRunning&&self.anim.stop(false);
        self.anim = new Anim(self.get('activeImg'),{
            left: parseInt(new_left * 1000,10)/1000 + 'px'
            ,top: parseInt(new_top * 1000,10)/1000 + 'px'
            ,width: parseInt(new_width * 1000,10)/1000 + 'px'
        },0.1).run();
        // D.css(self.get('activeImg'), 'left', parseInt(new_left * 1000,10)/1000 + 'px');
        // D.css(self.get('activeImg'), 'top', parseInt(new_top * 1000,10)/1000 + 'px');
        // D.css(self.get('activeImg'), 'width', parseInt(new_width * 1000,10)/1000 + 'px');
    }
    
    //binded in document
    function mouseup(e){
        var self = this;
        self.cancelEvent();
        //��ʼ��е����
        self.afterUserDrag_MyShowTime();
    }
    
    
    //------------------------------------------------------------------------------------base|hack functions
    function getMouseCoo(e){
        return {
            x: e.pageX || (e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft))
            ,y: e.pageY || (e.clientY + (document.documentElement.scrollTop || document.body.scrollTop))
        }
    }
    
    //get real style ��ȡ�߶ȡ���ȡ��ȱ�����Ϣ (*IE�� img��ǩ ��width��src���ԣ�������Ȼ��ȡ����heightֵ
    function getCurrentStyle(ele, attr){
        var result = '';
        //todo: if style.attr is setted get that
        // if(ele.style && ele.style[transToHump(attr)]){
            // return parseFloat(ele.style[transToHump(attr)])
        // }
        
        if(S.UA && S.UA.ie && ele.tagName == 'IMG' && attr == 'height'){
            return ele.offsetHeight;
        }
        if(window.getComputedStyle){
            result = window.getComputedStyle(ele,null)[attr];
        }
        else{
            attr = transToHump(attr);
            result = ele.currentStyle[attr];
        }
        result = result.replace(/[^0-9+-\.]/g,'');
        return ( parseInt(result,10)?(0-(0-result)):(0) );
    }
    
    //margin-top => marginTop
    function transToHump(s){
        return s.replace(/-([a-z])/gi, function(i,j){return j.toUpperCase();});
    }
    
    function log(s){
        if(window.console){
            console.log(s);
        }
        else{
            document.getElementById('footer').innerHTML += s + '<....>';
        }
        if(S.UA.ie){
            document.getElementById('footer').innerHTML += s + '<....>';
        }
    }
    
    // mirror from jquery
    function eleCoo(ele){
    
        if( 'getBoundingClientRect' in document.documentElement){//chrome ff ie 
            var box = ele.getBoundingClientRect();
            return {
                x: box.left + (window.pageXOffset || document.documentElement.scrollLeft)
                ,y: box.top + (window.pageYOffset || document.documentElement.scrollTop)
            }
        }
        else if(window.webkitConvertPointFromNodeToPage){
            var pointer = window.webkitConvertPointFromNodeToPage(ele, new window.WebKitPoint(0,0));
            return {
                x: pointer.x
                ,y: pointer.y
            }
        }
        return {x:0, y:0};
    }
    
    S.augment(DDObj, S.EventTarget, o);
    
    return new DDObj();
},{
    requires: [
        'template'
        ,'anim'
    ]
});