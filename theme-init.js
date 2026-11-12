/* Light theme by default. Dark only when the visitor has picked it with the switch. */
let savedTheme;try{savedTheme=localStorage.getItem('portfolio-theme');}catch{}document.documentElement.dataset.theme=savedTheme==='dark'?'dark':'light';document.documentElement.style.setProperty('--intro','0');
