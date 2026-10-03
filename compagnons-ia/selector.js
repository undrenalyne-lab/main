/* Pure decision rules: evidence matching, not a quality ranking. */
(function(root){
 function evaluate(product,preferences){
  const reasons=[],unknowns=[];
  if(preferences.offline&&product.offline===false)reasons.push('Le fournisseur indique que le produit ne peut pas fonctionner localement.');
  if(preferences.offline&&product.offline===null)unknowns.push('Fonctionnement hors ligne non confirmé dans les sources consultées.');
  if(preferences.export&&product.directExport!==true)unknowns.push('Export autonome non confirmé ; un droit sur demande ne suffit pas à ce critère.');
  if(preferences.memory&&product.memory!==true)unknowns.push('Mémoire persistante non confirmée.');
  const voice=preferences.mode==='voice';
  const freeSuitable=product.freeOngoing===true&&(!voice||product.voiceFree===true);
  let plan='Accès gratuit annoncé';
  if(preferences.budget==='0'){
   plan=product.freeOngoing===false?'Aperçu ponctuel uniquement':product.freeOngoing===null?'Démarrage gratuit annoncé ; limites à confirmer':'Accès gratuit limité annoncé';
   if(product.freeOngoing===false)reasons.push('Seulement un aperçu ponctuel gratuit, puis lecture seule.');
   else if(product.freeOngoing===null)unknowns.push('Accès gratuit durable et limites non confirmés.');
   if(voice&&product.voiceFree!==true)unknowns.push('Voix gratuite non confirmée.');
  }else if(!freeSuitable){
   plan='Formule payante à confirmer';
   if(voice&&product.voicePaid!==true)unknowns.push('Voix sur la formule payante non confirmée.');
   if(product.monthlyUsd===null)unknowns.push(preferences.budget==='any'?'Montant payant à vérifier.':'Prix inconnu : respect du plafond impossible à confirmer.');
   else{
    plan=product.monthlyUsd.toFixed(2).replace('.',',')+' USD / mois sur le web';
    if(preferences.budget!=='any'&&product.monthlyUsd>Number(preferences.budget))reasons.push('Tarif mensuel web publié supérieur à votre plafond.');
   }
  }
  return {id:product.id,status:reasons.length?'excluded':unknowns.length?'unknown':'match',reasons,unknowns,plan};
 }
 function select(products,preferences){return products.map(p=>evaluate(p,preferences));}
 root.CompanionSelector={evaluate,select};
 if(typeof module!=='undefined')module.exports=root.CompanionSelector;
})(typeof window==='undefined'?globalThis:window);
