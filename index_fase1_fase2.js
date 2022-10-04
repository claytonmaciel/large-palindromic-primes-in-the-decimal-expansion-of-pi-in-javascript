const fs = require('fs');
const CHUNK_SIZE = 500000000; // 500 MB - Tamanho do pedaço do arquivo que vai para memória RAM.                 
const DNPI = 9; //Números de dígitos do palíndromo a ser encontrado.
let resp = [] //Variável resposta que armazena os palíndromose primos encontrados na expansão decimal do PI.
const file = './Pib.txt'; 
//const file = '/Volumes/CLAYTON/pi_dec_1t_02.txt';


/* As três funções a seguir (power, miillerTest, isPrime)
foram adaptadas do site: https://www.geeksforgeeks.org/primality-test-set-3-miller-rabin/
O teste Miller-Rabin (por Gary Miller e Michael Rabin) é um teste probabilístico da primitividade de um dado número n.
Se um número n não passar pelo teste, n com certeza é um número composto (ou seja, não-primo).
Se o número passar no teste, ele é muito provável que n seja primo.
A margem de erro pode ser diminuída arbitrariamente, aplicando-se o teste várias vezes ao mesmo número n.
No caso do algoritmo abaixo, aumente o valor do k na função isPrime para aumentar a confiabilidade do resultado. 
As explicações do código dessas funções encontra-se no site. */

function power(x, y, p){
    let res = 1n;   
    x = x % p;

    while (y > 0n){
        if (y & 1n) res = (res*x) % p;

        y = y/2n;
        x = (x*x) % p;
    }
    return res;
}


function miillerTest(d, n){
    const r = BigInt(Math.floor(Math.random() * 100_000))
    const y = r*(n-2n)/100_000n
    let a = 2n + y % (n - 4n);

    let x = power(a, d, n);

    if (x == 1n || x == n-1n) return true;

    while (d != n-1n){
        x = (x * x) % n;
        d *= 2n;

        if (x == 1n) return false;
        if (x == n-1n) return true;
    }
    return false;
}

function isPrime(n, k=10){
    if (n <= 1n || n == 4n) return false;
    if (n <= 3n) return true;

    let d = n - 1n;
    while (d % 2n == 0n) d /= 2n;

    for (let i = 0; i < k; i++)
        if (!miillerTest(d, n))
            return false;

    return true;
}


//Função para converter milissegundos em tempo(hh:mm:ss.m) 
function msToTime(duration) {  
  var milliseconds = Math.floor((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + " hora(s), " + minutes + " minuto(s), " + seconds + " segundo(s) e " + milliseconds + " milissegundo(s). " ;
}


// Função que recebe o intervalo de casa decimais do PI e verifica se o primeiro 
//e o último dígitos são iguais e se o último dígito é par, se for, retorna o número, se não, retorna 0    
function calcPalinPrimo(numPI){ 
    for (let i = 0; i < numPI.length-DNPI+1; i++) {
        
        if (numPI[i] !== numPI[i+DNPI-1] || numPI[i+DNPI-1] % 2 == 0) continue // Se o número primeiro dígito for diferente do último dígito ou se o último dígito for par, continue
        
        let num = "", j = 0, numr = ""
    
        while (numPI[i+j] === numPI[DNPI-1+i-j] && j < Math.trunc(DNPI/2)){ // Verifica se os DNPI/2 primeiros dígitos são iguais aos DNPI/2 últimos. 
            num += numPI[i+j];
            numr = numPI[i+j] + numr;
            j++;
        }
        
        if (j === Math.trunc(DNPI/2)){ // Caso o número seja palindromo entra na condição
            
            if (DNPI % 2 === 0) //Se o número de dígitos for par.
                num =  num+numr;
            else
                num =  num+numPI[i+j]+numr;   //Se o número de dígitos for ímpar.
            
            if (isPrime(BigInt(num))) return [i,num];// Caso o número seja primo, retorna a posição e o número.
                
        }        
    }
    return -1;
}


//Fatia o arquivo em bytes [início, fim e tamanho da fatia em bytes do arquivo]: ini, fim, chunk
async function buscaPalinPrimo(ini,fim){ 
    const stream = fs.createReadStream(file, { start: ini, end: fim, highWaterMark: CHUNK_SIZE });
    let ret = 0;

    for await(const data of stream) { //data é a fatia do arquivo (com as casas decimais do PI)
      ret = calcPalinPrimo(data.toString());
      if(ret === -1) continue;
      
      resp.push([ini+ret[0],ret[1]]); //quando encontrou algum número, adiciona no array resp e finaliza a busca naquela parte do arquivo.
      break;
    }
}


//Função que divide as buscas paralelas para principalmente em um arquivo grande.
//A divisão é em bytes [início, fim e quantidade de bytes]
async function buscaPartesArquivo() {
  
  const partesArq = parseInt(fs.statSync(file).size/CHUNK_SIZE);
  
  await buscaPalinPrimo(CHUNK_SIZE*0,CHUNK_SIZE*1); //busca o palindromo e primo na primeira parte do arquivo.
  for (let it = 1; it < partesArq; it++){ //busca o palindromo e primo na segunda parte do arquivo em diante.
    if (resp.length > 0) break;  
    await buscaPalinPrimo(CHUNK_SIZE*it - DNPI - 1,CHUNK_SIZE*(it+1));
  }
  
}


// Função principal
async function main() { 
    console.log("Executando...Aguarde!");
    const inicio = Date.now();
    await buscaPartesArquivo();
    let tempo = msToTime(Date.now() - inicio);
    
    if (resp.length > 0) 
        console.log("=============================\nNúmero mágico [pos,num]:",resp);
    else
        console.log("=============================\nNenhum número encontrado! :-0");
    
    console.log("=============================\nTempo de processamento: "+tempo);
}

main();