const fs = require('fs');
//const CHUNK_SIZE = 100000000; // 100 MB - Tamanho do pedaço do arquivo que vai para memória RAM.                 
const CHUNK_SIZE = 300000; // 300 KB - Tamanho do pedaço do arquivo que vai para memória RAM.                 
let DNPI = 9; //Números de dígitos atual do maior palindromo primo.
let resp = new Map(); //Variável resposta que armazena os palíndromos e primos encontrados na expansão decimal do PI.
const file = './PIb.txt'; 
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


//Função para encontrar os palíndromos de uma string. Baseado no algoritmo de Manacher. O(N^2).
//Link do Algoritmo: https://www.geeksforgeeks.org/find-number-distinct-palindromic-sub-strings-given-string/
// JavaScript program to find all distinct palindrome sub-strings
// of a given string

// Function to print all distinct palindrome sub-strings of s
function palindromeSubStrs(s, pos_ini){
    //let m = new Map();
    let n = s.length;

    // table for storing results (2 rows for odd-
    // and even-length palindromes
    let R = new Array(2);
    for(let i = 0; i < 2; i++)
        R[i] = new Array(n + 1);

    // Find all sub-string palindromes from the given input
    // string insert 'guards' to iterate easily over s
    s = "@" + s + "#";

    for (let j = 0; j <= 1; j++)
    {
        let rp = 0; // length of 'palindrome radius'
        R[j][0] = 0;

        let i = 1;
        while (i <= n)
        {
        
            // Attempt to expand palindrome centered at i
            while (s[i - rp - 1] == s[i + j + rp])
                rp++; // Incrementing the length of palindromic
                    // radius as and when we find valid palindrome

            // Assigning the found palindromic length to odd/even
            // length array
            R[j][i] = rp;
            let k = 1;
            while ((R[j][i - k] != rp - k) && (k < rp))
            {
                R[j][i + k] = Math.min(R[j][i - k],rp - k);
                k++;
            }
            rp = Math.max(rp - k,0);
            i += k;
        }
    }

    // remove 'guards'
    s = s.substring(1, n+1);

    // Put all obtained palindromes in a hash map to
    // find only distinct palindromes
    for (let i = 1; i < n; i++)
    {
        for (let j = 0; j <= 1; j++){
            for (let rp = R[j][i]; rp > 0; rp--){
                let aux = s.substring(i - rp - 1, i + rp + j-1);
                
                let tam = aux.length;

                if (tam > DNPI - 1 && isPrime(BigInt(aux))){ //quantidade de digitos que poderão ser inseridos no map.
                    resp.set(aux,pos_ini + i - rp - 1);
                    //console.log(aux,pos_ini + i - rp - 1);
                    DNPI++; 
                }
            }
        }
        
    }

}


//Fatia o arquivo em bytes [início, fim e tamanho da fatia em bytes do arquivo]: ini, fim, chunk
async function buscaPalinPrimo(ini,fim){ 
    const stream = fs.createReadStream(file, { start: ini, end: fim, highWaterMark: CHUNK_SIZE });
    
    for await(const data of stream) { //data é a fatia do arquivo (com as casas decimais do PI)

      palindromeSubStrs(data.toString(),ini);
      
    }
}


//Função que divide as buscas paralelas para principalmente em um arquivo grande.
//A divisão é em bytes [início, fim e quantidade de bytes]
async function buscaPartesArquivo() {
  
  const partesArq = parseInt(fs.statSync(file).size/CHUNK_SIZE);

  if (partesArq == 0)
    console.log("procurando na parte: 1 de 1"); 
  else
    console.log("procurando na parte: 1 de ",partesArq); 
  
  await buscaPalinPrimo(CHUNK_SIZE*0,CHUNK_SIZE*1); //busca o palindromo e primo na primeira parte do arquivo.
  for (let it = 1; it < partesArq; it++){ //busca o palindromo e primo na segunda parte do arquivo em diante.
    console.log("procurando na parte: ",(it+1)," de ",partesArq);  
    await buscaPalinPrimo(CHUNK_SIZE*it - DNPI - 1,CHUNK_SIZE*(it+1));
  }
  
}


// Função principal
async function main() { 
    console.log("Executando...Aguarde!");
    const inicio = Date.now();
    await buscaPartesArquivo();
    let tempo = msToTime(Date.now() - inicio);
    
    if (resp.size > 0)
        for(let [x, y] of resp)
            console.log("Número: ",x,". Posição: ",y);
    else
        console.log("=============================\nNenhum número encontrado! :-0");
    
    console.log("=============================\nTempo de processamento: "+tempo);
}

main();