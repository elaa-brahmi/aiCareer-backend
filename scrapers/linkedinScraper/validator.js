const validateSearchParams = async(keywords) => {
  if (!keywords) {
    return 'Keywords parameter is required';
  }

  
  if (keywords.length < 2) {
    return 'Keywords must be at least 2 characters long';
  }


  return null;
}
module.exports={validateSearchParams}