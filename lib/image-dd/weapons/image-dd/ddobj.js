/**
  * yumen t=20120526
  */

/**
  * 单例拖拽
  */
KISSY.add('weapons/image-dd/ddobj', function(S, Template, Anim, PC){
    var D = S.DOM, E = S.Event, $ = S.all;
    
    var WHEEL_STEP = 1 //鼠标中键滚动几次触发行为
    ,WHEEL_PIX = 50 //一次缩放像素值
    ,SHOW_DOWN = 0 //减速运动的减速度大小
    ,MOUSE_MOVE_AUTO_CLOSE_TIMER = 5000 // 鼠标在经过 设定的时间内没有发生move的行为，逻辑跳转到mouseup
    ,DEGRADATION = 5 //降级（针对move事件触发频率）
    ;
    
    var POPUP_HD_TPL = '<div class="box-hd hidden close-rt-wrap" ><a href="#" title="按退出键，也可以关闭哦" class="close-rt J_Close" id="J_CloseImageDD"></a></div>'
    
    ,POPUP_BD_TPL = '<div class="box-bd"></div>'
    
    ,POPUP_IMG = '<img title="鼠标滚轮可以放大图片" class="G_K" style="width:{{showWidth}}px;left:{{left}}px;top:{{top}}px;" src="{{imgSrc}}"  />'
    
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
      * @param{HTMLIMGElement} 一个img标签对象的引用
      */
    function DDObj(ele){
        var self = this;
        self.config = CFG;
        self.inited = false;//垫片是否初始化过
        self.popup = null; //全屏浮框容器
        self.activeImg = null;//当前活跃的img标签
        self.activeImgPos = {left:0,top:0}; //mousedown时图片所在位置
        self.mousedownCoo = {}; //鼠标mousedown位置的坐标
        self.anim = null;//滚轮控制放大缩小的动画
        self.initAnim = null;//初始化定位图片动画
        self.bigImgObj = new Image();//大图img对象
        self.initWidth = 0;
        self.defaultMaxWidth = 10000;//图片放大到最大宽度
        self.defaultMinWidth = 50; //图片缩小到最小宽度
        
        self.dragInfoX = []; //拖拽图片的坐标记录
        self.dragInfoY = [];
        self.dragInfoTime = []; //拖拽发生的时间记录
        self.autoSlideAnim = null; //Anim obj
        
        S.mix(self.config, {
            ele: (ele)?(S.isArray(ele)?(ele):([ele])):([])
        });
        self._init();
    }
    
    var o = {
        _init: function(){
            var self = this, cfg = self.config;
            
            //初始化 new 对象时的
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
        
        //给add进来的img 或 img的容器，注册click事件
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
                    //初始化垫片
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
        
        //初始化显示图片大图
        ,_showPopupImg: function(srcUrl, srcUrlThunmb){
            var self = this
            ,clientHeight = document.body.clientHeight || document.documentElement.clientHeight
            ,clientWidth  = document.body.clientWidth  || doucment.doucmentElement.clientWidth
            ;
            
            //添加当前图片
            self.popupBd.innerHTML = Template(POPUP_IMG).render({
                imgSrc: srcUrlThunmb//初始化显示小图
                ,imgAlt: '图片大图'
                ,showWidth: parseInt(clientWidth/2,10)
                ,left: parseInt(clientWidth/4,10) //将图片显示在正中间
                ,top: 0
            });
            
            //------------------------------------------------------------------初始化一些数据
            self.popup.style.height = (document.body.scrollHeight || document.documentElement.scrollHeight) + 'px';
            self.popup.style.width  = (document.body.scrollWidth || document.documentElement.scrollWidth) + 'px';
            self.set('initWidth', parseInt(clientWidth/2,10));//初始化图片显示的宽度
            
            self.cleanRecords(true);
            
            self.set('activeImg', D.get('IMG', self.popupBd) );//获取新插入的图片的DOM引用
            
            //调整图片到窗口可见区域
            self.initAnim && self.initAnim.stop(false);
            self.initAnim = new Anim(self.get('activeImg'), {
                top: (document.body.scrollTop || document.documentElement.scrollTop) + 30 + 'px'
            },1,'easeOutStrong').run();
            
            //大图加载好后 显示大图
            self.bigImgObj.onload = null;
            if( srcUrl || srcUrl != ''){
                self.bigImgObj = null;
                self.bigImgObj = new Image();
                self.bigImgObj.onload = function(){
                    self.get('activeImg').src = srcUrl;
                }
                
            };
            self.bigImgObj.src = srcUrl;
            
            //注册鼠标中键滚轮事件
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
        
        //全屏蒙板 execute just one time
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
        
        //弹出框mousedown事件， execute just one time , event will never cancel
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
                
                //停止初始化的定位动画
                self.initAnim && self.initAnim.stop(false);
                self.initAnim = null;
                
                //初始化拖拽信息
                self.cleanRecords(true);
                
                self.dragInfoX.push(getCurrentStyle(target, 'left')); //拖拽图片的坐标记录
                self.dragInfoY.push(getCurrentStyle(target, 'top'));
                self.dragInfoTime.push(new Date().getTime()); //拖拽发生的时间记录
                
                
                self.set( 'activeImg', target);
                
                self.set('mousedownCoo', getMouseCoo(e) );
                self.set('activeImgPos',{
                    left: getCurrentStyle(target, 'left')
                    ,top: getCurrentStyle(target, 'top')
                });
                
                //取消文本选中
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
        
        //创建弹出框盒子 的hd、bd、bt的引用
        ,_initHTMLElement: function(){
            var self = this;
            self.popupOpacityBg = D.get('.img-dd-opacity-bg', self.popup);
            self.popupBox = D.get('.img-dd-box', self.popup);
            self.popupHd = D.get('.box-hd', self.popup);
            self.popupBd = D.get('.box-bd', self.popup);
            self.popupBt = D.get('.box-bt', self.popup);
        }
        
        
        //鸡肋： 根据拖拽过程中记录的 x、y、time 制造 拖拽mouseup后的滑动效果
        ,afterUserDrag_MyShowTime: function(){
            var self = this;
            // self.dragInfoX = []; //拖拽图片的坐标记录
            // self.dragInfoY = [];
            // self.dragInfoTime = []; //拖拽发生的时间记录
            var len = self.dragInfoX.length;
            
            if(true || len < 3){
                //走直线
                self.slide_straightLine();
                return false;
            }
            else{
                //走一个圆圈
                var x1 = self.dragInfoX[len-3], y1 = self.dragInfoY[len-3]
                ,x2 = self.dragInfoX[len-2], y2 = self.dragInfoY[len-2]
                ,x3 = self.dragInfoX[len-1], y3 = self.dragInfoY[len-1]
                ;
                
                // log( PC.getNextPoint(x1,y1,x2,y2,x3,y3 ,1/6) );   
            }
        }
        
        //使用kissy anim走一段直线
        ,slide_straightLine: function(){
            var self = this;
            
            //落点坐标
            var x,y;
                                   
            //计算加速度
            var len = self.dragInfoTime.length, t = 1, ts = 1//ts速度区间数
            ,dt = self.dragInfoTime[len-(++t)]-self.dragInfoTime[len-(++t)]//第一个速度区间
            ,ldt = (self.dragInfoTime[len-1]-self.dragInfoTime[len-2])
            ,vnx = (self.dragInfoX[len-1]-self.dragInfoX[len-2])/ldt
            ,vny = (self.dragInfoY[len-1]-self.dragInfoY[len-2])/ldt
            vdx = 0 , vdy = 0;
            
            //求加速度 最多取到最后三个点
            //如果本次拖拽发生的时间比较久远，判定为远古拖拽，不影响自动滑动
            while(t < 4 && self.dragInfoTime[len-t] && self.dragInfoTime[len-1] - self.dragInfoTime[len-t] > 1000){
                dt += self.dragInfoTime[len-t+1]-self.dragInfoTime[len-t];
                vdx = (self.dragInfoX[len-t+1]-self.dragInfoX[len-t])/dt,
                vdy = (self.dragInfoY[len-t+1]-self.dragInfoY[len-t])/dt;
                ++t;++ts;
            }
            
            //先求末速度、倒数第二末速度、加速度
            var accx = (vnx - vdx)/ldt
            ,accy = (vny - vdy)/ldt
            ,acct = Math.abs(vnx/accx)//减速运动时间
            
            ;
            
            // accx = 0 - Math.abs(accx);
            // accy = 0 - Math.abs(accy);
            var new_left, new_top;
            if(Math.abs(self.dragInfoX[len-1] - self.dragInfoX[len-2]) < 2){
                //垂直Y轴方向
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
        
        //清理拖拽记录数组  防止按住不放时，数组变成无限大的情况
        ,cleanRecords: function(clearAll){
            var self = this;
            self.dragInfoX = []; //拖拽图片的坐标记录
            self.dragInfoY = [];
            self.dragInfoTime = []; //拖拽发生的时间记录
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
        
        
        if(moveCtlTimer < DEGRADATION){//做限制
            ++moveCtlTimer;
            return false;
        }
        moveCtlTimer = 0;
        var self = this;
        
        var currentMouseCoo = getMouseCoo(e);//当前鼠标所在坐标
        
        
        // console.log(currentMouseCoo);
        var distance = {
            left: currentMouseCoo.x - self.get('mousedownCoo').x
            ,top: currentMouseCoo.y - self.get('mousedownCoo').y
        };
        var new_top = parseInt(self.get('activeImgPos').top,10) + distance.top
        ,new_left = parseInt(self.get('activeImgPos').left,10) + distance.left
        ;
        
        //记录拖拽的信息
        // log(++window.rcount + ':' + S.JSON.stringify(getMouseCoo(e)) + ';timer:' + new Date().getTime());
        // log(self.dragInfoTime[self.dragInfoTime.length-2] && (self.dragInfoTime[self.dragInfoTime.length-1]-self.dragInfoTime[self.dragInfoTime.length-2]) ) ;
        self.dragInfoX.push(new_left); //拖拽图片的坐标记录
        self.dragInfoY.push(new_top);
        self.dragInfoTime.push(new Date().getTime()); //拖拽发生的时间记录
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
        //清空减速滑动动画
        self.cleanRecords();
        
        var action = '';
        
        //记录 放大 | 要缩小
        if(e.wheelDelta){action = (e.wheelDelta == 120)?('zoom'):('shrunk');}
        else if( e.detail){action = (e.detail == -3)?('zoom'):('shrunk');}
        if(action == '')return false;
        //反向行为，currentAction记录重置
        if(action != currentAction){currentAction = action;return false;}
                
        //图片当前 宽高
        var activeImgSize = {
            width: getCurrentStyle(self.get('activeImg'), 'width')
            ,height: getCurrentStyle(self.get('activeImg'), 'height')
        };
        
        //图片的尺寸到达上限 或 下限
        if( (action == 'shrunk' && activeImgSize.width < self.get('defaultMinWidth')) 
            || ( action == 'zoom' && activeImgSize.width > self.get('defaultMaxWidth') ) ){
            return false;
        }
        
        //------------------------------------------------------------------开始调整图片宽度
        //当前鼠标所在位置
        var mouseCoo = getMouseCoo(e);
        //当前图片的偏移位置(相对body)
        var activeImgCoo = eleCoo(self.get('activeImg'));
        
        //当前图片的偏移位置 (相对offsetParent)
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
        //光标是否落在图片上
        if( mouseCoo.x >= activeImgCoo.x && mouseCoo.x <= (activeImgCoo.x + activeImgSize.width)
            && mouseCoo.y >= activeImgCoo.y && mouseCoo.y <= (activeImgCoo.y + activeImgSize.height) ){//长方形区域
            var ratio = 1, ratioX = 1, ratioY = 1;
            ratioX = (mouseCoo.x - activeImgCoo.x)/(activeImgSize.width);
            ratioY = (mouseCoo.y - activeImgCoo.y)/(activeImgSize.height);
            if(action == 'shrunk'){//缩小
                new_left += additionWidth*ratioX;
                new_top  += additionHeight*ratioY;
            }
            else{//放大
                new_left -= additionWidth*ratioX;
                new_top  -= additionHeight*ratioY;
            }
        }
        else{//居中缩放
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
        //开始机械滑动
        self.afterUserDrag_MyShowTime();
    }
    
    
    //------------------------------------------------------------------------------------base|hack functions
    function getMouseCoo(e){
        return {
            x: e.pageX || (e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft))
            ,y: e.pageY || (e.clientY + (document.documentElement.scrollTop || document.body.scrollTop))
        }
    }
    
    //get real style 获取高度、宽度、等标量信息 (*IE中 img标签 有width、src属性，不过依然获取不到height值
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