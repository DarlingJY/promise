//完整的Promise

//Promise三个状态：resolve reject pending
const FULFILLED = 'FULFILLED'
const PENDING = 'PENDING'
const REJECTED = 'REJECTED'

//处理x 
const resolvePromise = (promise2, x, resolve, reject) => {
  //https://promisesaplus.com/ 2.3.1
  //循环引用 抛出类型错误
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
  }

  //https://promisesaplus.com/ 2.3.3
  if (typeof x === 'object' && x !== null || typeof x === 'function') {
    //2.3.3.3 防止既走resolve 又走reject 为了兼容其他promise 
    let called
    try {
      let then = x.then
      if (typeof then === 'function') {
        then.call(x, y => {
          if (called) return;
          called = true;
          resolvePromise(promise2, y, resolve, reject)
        }, r => {
          if (called) return;
          called = true;
          reject(r)
        })
      } else {
        resolve(x)
      }
    } catch (e) {
      if (called) return;
      called = true;
      reject(e)
    }

  } else {
    resolve(x)
  }

}
class Promise {
  constructor(executor) {
    this.status = PENDING;
    this.value = undefined;
    this.reason = undefined;
    this.onResolvedCallbacks = []
    this.onRejectedCallbacks = []
    const resolve = (value) => {
      //如果value是promise 需要实现递归解析
      if(value instanceof Promise){
        return value.then(resolve,reject)
      }
      if (this.status === PENDING) {
        this.value = value
        this.status = FULFILLED
        this.onResolvedCallbacks.forEach(fn => fn())
      }

    }

    const reject = (reason) => {
      if (this.status === PENDING) {
        this.reason = reason
        this.status = REJECTED
        this.onRejectedCallbacks.forEach(fn => fn())
      }
    }
    try {
      executor(resolve, reject)
    } catch (err) {
      reject(err)
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
    onRejected = typeof onRejected === 'function' ? onRejected : e => { throw e }
    let promise2 = new Promise((resolve, reject) => {
      if (this.status === FULFILLED) {
        //等到promise2 创建以后再执行
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value)
            resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }

        })

      }
      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason)
            resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }

        })
      }
      if (this.status === PENDING) {
        this.onResolvedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value)
              resolvePromise(promise2, x, resolve, reject)
            } catch (e) {
              reject(e)
            }

          })
        })
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason)
              resolvePromise(promise2, x, resolve, reject)
            } catch (e) {
              reject(e)
            }

          })
        })
      }

    })
    return promise2
  }

  catch(errCallback){
    return this.then(null,errCallback)
  }

  //默认产生一个成功的Promise
  static resolve(value){
    //具备等待功能 如果value是promise 会等待这个promise解析完毕 再向下执行
    return new Promise((resolve,reject)=>{
      resolve(value)
    })
  }

  //默认产生一个失败的Promise
  static reject(reason){
    return new Promise((resolve,reject)=>{
      reject(reason)
    })
  }
}

//finally传入的函数 无论成功还是失败都会执行
Promise.prototype.finally = function(cb){
  return this.then((value)=>{
    return Promise.resolve(cb()).then(()=>value)
  },err=>{
    return Promise.resolve(cb()).then(()=>{throw err})
  })
}

Promise.all = function(values){
  return new Promise((resolve,reject)=>{
    const resultArr = []
    let count = 0
    const processResultByKey = (val,index)=>{
      resultArr[index] = value;
      if(++count===values.length){
        resolve(resultArr)
      }
    }
    for(let i=0;i<values.length;i++){
      let value = values[i];
      if(value&&typeof value.then==='function'){
        value.then((val)=>{
          processResultByKey(value, i);
        },reject)
      }else{
        processResultByKey(value, i);
      }
    }
  })
}

Promise.race = function(values){
  return new Promise((resolve,reject)=>{
    for(let i=0;i<values.length;i++){
      let value = values[i];
      if(value&&typeof value.then==='function'){
        value.then(resolve,reject)
      }else{
        resolve(value)
      }
    }
  })
}

//测试Promise A+规范
// 产生延迟对象 快速的创建一个Promise对象 解决回调嵌套问题
Promise.defer = Promise.deferred = function () {
  let dfd = {};
  dfd.promise = new Promise((resolve,reject)=>{
      dfd.resolve = resolve;
      dfd.reject = reject;
  });
  return dfd;
}

//npm install promises-aplus-tests -g
// promises-aplus-tests promise.js"


module.exports = Promise