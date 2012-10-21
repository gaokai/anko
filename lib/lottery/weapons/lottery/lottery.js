/**
 * User: g.gaokai@gmail.com
 * Date: 12-10-19
 * describe: simple lottery function
 */

KISSY.add('weapons/lottery/lottery', function(S){
  var $ = S.all;

  function Lottery(config){

  }

  var o = {};

  S.augment(Lottery, S.EventTarget, o);

  return Lottery;
});