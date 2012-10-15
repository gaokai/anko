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
                alert('[������ʾ]�����������������');
                alert('����');
                return false;
            }
            
            return self.getNextPoint(x1,y1,x2,y2,x3,y3,1/3);
            
        }
        
        //at the one line
        ,isPointBlank: function(x1,y1,x2,y2,x3,y3){
            var self = this;
            // var x1,y1,x2,y2,x3,y3;
            if( ( x1 == x2 && x2 == x3) || ( y1 == y2 && y2 == y3 )){
                log('���Ϊ������ͬһ��ֱ����');
                return true;
            }
            
            //todo ��Լ�����ķ���ȫ���ȣ����ҡ�ڷ�Χ
            
            return false;
            
        }
        
        //��֪���� ��Բ��
        ,getCentrePoint: function(x1,y1,x2,y2,x3,y3){
            var self = this;
            // var x1,y1,x2,y2,x3,y3;
            var x, y, r;
            
            if( self.isPointBlank(x1,y1,x2,y2,x3,y3) ){
                return false;
            }
            
            //����Բ�ĵ�����ľ�����ȵĽⷨ������ ��һ�δ���copy���ϵ���
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
        
        //��ȡԲ�İ뾶
        ,getRadius: function(x1,y1,x2,y2,x3,y3){
            var self = this;
            
            return self.getCentrePoint(x1,y1,x2,y2,x3,y3)['r'];
        }
        
        //����˳ʱ�롢��ʱ�뷽�� �����������������һ�������
        ,getNextPoint: function(x1,y1,x2,y2,x3,y3,add_angle, isPI){
            var self = this;
            // var x1,y1,x2,y2,x3,y3;
            var x,y;
            var xr, yr, r;//Բ�����꣬�뾶
            
            var centreInfo = self.getCentrePoint(x1,y1,x2,y2,x3,y3);
            xr = centreInfo.x;
            yr = centreInfo.y;
            r  = centreInfo.r;
            
            //====================================
            // ʹ��Բ�ļ����귽�̼�����Ŀ���
            //====================================
            //��Բ���ƶ��� ���� => ��Բ�ļ����귽��Ϊ��p = r
            x1 -= xr; y1 -= yr;
            x2 -= xr; y2 -= yr;
            x3 -= xr; y3 -= yr;
            //1��p1,p2,p3 ����ļ�����Ϊ��r, angle_1��,��r, angle_2��,��r, angle1_3��
            //2����Ӧ ֱ������ϵ����Ϊ (r*cos(angle), r*sin(angle))
            //3��r*cos(angle_1) = x1, r*sin(angle_1) = y1 => cos(angle_1) = x1/r, sin(angle_1) = y1/r
            //4��˳ʱ����ĸ����angle_4 = angle_3 - add_angle 
            //5����ʱ����ĸ����angle_4 = angle_3 + add_angle 
            //6��cos(angle_4) = (1-2*sin(angle_3)*sin(angle_3))*cos(angle_2) + 2*sin(angle_3)*cos(angle_3)*sin(angle_2)
            //7��sin(angle_4) = 2*sin(angle_3)*cos(angle_3)*cos(angle_2) - (1-2*sin(angle_3)*sin(angle_3))*sin(angle_2)
            //8��x = r*cos(angle_4), y = r*sin(angle_4)
            
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
            // -> 6 ˳ʱ�뷽�� angle_4 = angle_3 - add_angle
            if( (y3 - y2)/(x3 - x2) < (y2 - y1)/(x2 - x1) ){
                var cos_angle_4 = cos_angle_3*cos_add_angle + sin_angle_3*sin_add_angle
                ,sin_angle_4 = sin_angle_3*cos_add_angle - cos_angle_3*sin_add_angle
                ;
                log('clockWise');
            }
            // -> 7 ��ʱ�뷽�� angle_4 = angle_3 + add_angle
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

