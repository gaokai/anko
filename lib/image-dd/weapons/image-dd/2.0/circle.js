/**
  * yumen t=20120527
  */
KISSY.add('weapons/image-dd/circle/pathcalculator',function(S){
    
    var sin = Math.sin, cos = Math.cos, PI = Math.PI, sqrt = Math.sqrt;
    
    function PathCalculator(){
        
    }
    
    var o = {
        _init: function(){
            var self = this;
        }
        
        //input three points' coordinate
        ,cal: function(x1,y1,x2,y2,x3,y3){
            var self = this;
            // log(arguments.length)
            if(arguments.length < 6){
                alert('[中文提示]请输入三个点的坐标');
                alert('中文');
                return false;
            }
            
            return self.getNextPoint(x1,y1,x2,y2,x3,y3,1/3);
            
        }
        
        //at the one line
        ,isPointBlank: function(x1,y1,x2,y2,x3,y3){
            var self = this;
            // var x1,y1,x2,y2,x3,y3;
            if( ( x1 == x2 && x2 == x3) || ( y1 == y2 && y2 == y3 )){
                log('诊断为三点在同一条直线上');
                return true;
            }
            
            //todo 针对计算机的非完全精度，添加摇摆范围
            
            return false;
            
        }
        
        //已知三点 求圆心
        ,getCentrePoint: function(x1,y1,x2,y2,x3,y3){
            var self = this;
            // var x1,y1,x2,y2,x3,y3;
            var x, y, r;
            
            if( self.isPointBlank(x1,y1,x2,y2,x3,y3) ){
                return false;
            }
            
            //采用圆心到三点的距离相等的解法求坐标 这一段代码copy网上的了
            var a, b, c, d, e, f;
            a=2*(x2-x1);
            b=2*(y2-y1);
            c=x2*x2+y2*y2-x1*x1-y1*y1;
            d=2*(x3-x2);
            e=2*(y3-y2);
            f=x3*x3+y3*y3-x2*x2-y2*y2;
            x=(b*f-e*c)/(b*d-e*a);
            y=(d*c-a*f)/(b*d-e*a);
            r=sqrt((x-x1)*(x-x1)+(y-y1)*(y-y1));
            
            return {
                x: x
                ,y: y
                ,r: r
            };
        }
        
        //获取圆的半径
        ,getRadius: function(x1,y1,x2,y2,x3,y3){
            var self = this;
            
            return self.getCentrePoint(x1,y1,x2,y2,x3,y3)['r'];
        }
        
        //根据顺时针、逆时针方向 计算出，三点过后的下一点的坐标
        ,getNextPoint: function(x1,y1,x2,y2,x3,y3,add_angle, isPI){
            var self = this;
            // var x1,y1,x2,y2,x3,y3;
            var x,y;
            var xr, yr, r;//圆心坐标，半径
            
            var centreInfo = self.getCentrePoint(x1,y1,x2,y2,x3,y3);
            xr = centreInfo.x;
            yr = centreInfo.y;
            r  = centreInfo.r;
            
            //====================================
            // 使用圆的极坐标方程计算下目标点
            //====================================
            //将圆心移动到 极点 => 则，圆的极坐标方程为：p = r
            x1 -= xr; y1 -= yr;
            x2 -= xr; y2 -= yr;
            x3 -= xr; y3 -= yr;
            //1、p1,p2,p3 三点的极坐标为（r, angle_1）,（r, angle_2）,（r, angle1_3）
            //2、对应 直角坐标系坐标为 (r*cos(angle), r*sin(angle))
            //3、r*cos(angle_1) = x1, r*sin(angle_1) = y1 => cos(angle_1) = x1/r, sin(angle_1) = y1/r
            //4、顺时针第四个点的angle_4 = angle_3 - add_angle 
            //5、逆时针第四个点的angle_4 = angle_3 + add_angle 
            //6、cos(angle_4) = (1-2*sin(angle_3)*sin(angle_3))*cos(angle_2) + 2*sin(angle_3)*cos(angle_3)*sin(angle_2)
            //7、sin(angle_4) = 2*sin(angle_3)*cos(angle_3)*cos(angle_2) - (1-2*sin(angle_3)*sin(angle_3))*sin(angle_2)
            //8、x = r*cos(angle_4), y = r*sin(angle_4)
            
            //-> 3
            var cos_angle_1 = x1 / r, sin_angle_1 = y1 / r
               ,cos_angle_2 = x2 / r, sin_angle_2 = y2 / r
               ,cos_angle_3 = x3 / r, sin_angle_3 = y3 / r
               ;
            if(isPI !== true){
                add_angle *= PI;
            }
            
            var cos_add_angle = cos(add_angle), sin_add_angle = sin(add_angle);
            log(cos_add_angle+ ',' +sin_add_angle)
            // log(add_angle)
            // -> 6 顺时针方向 angle_4 = angle_3 - add_angle
            if( (y3 - y2)/(x3 - x2) < (y2 - y1)/(x2 - x1) ){
                var cos_angle_4 = cos_angle_3*cos_add_angle + sin_angle_3*sin_add_angle
                ,sin_angle_4 = sin_angle_3*cos_add_angle - cos_angle_3*sin_add_angle
                ;
                log('clockWise');
            }
            // -> 7 逆时针方向 angle_4 = angle_3 + add_angle
            else if( (y3 - y2)/(x3 - x2) > (y2 - y1)/(x2 - x1) ){
                var cos_angle_4 = cos_angle_3*cos_add_angle - sin_angle_3*sin_add_angle
                ,sin_angle_4 = sin_angle_3*cos_add_angle + cos_angle_3*sin_add_angle
                log('antiClockWise');
            }
            ;
            
            // x = r * cos_angle_4;
            // y = r * sin_angle_4;
            
            return {
                x: r * cos_angle_4 + xr
                ,y: r * sin_angle_4 + yr
            };
        }
        
    };
    
    S.augment(PathCalculator, o);
    
    return PathCalculator;
});

KISSY.add('weapons/image-dd/circle',function(S, PC){
    
    return new PC();
    
},{
    requires: ['./circle/pathcalculator']
})

