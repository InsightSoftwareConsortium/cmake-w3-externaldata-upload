const output = document.querySelector('#output')

// From the web3.storage client browser example
export function showMessage (text) {
  const node = document.createElement('div')
  node.innerText = text
  output.appendChild(node)
}

export function showLink (url) {
  const node = document.createElement('a')
  node.href = url
  node.innerText = `> 🔗 ${url}`
  output.appendChild(node)
}