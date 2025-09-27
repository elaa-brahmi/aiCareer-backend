const formatJobData = (jobData) => {
  return {
    title: jobData.title,
    company: jobData.company,
    location: jobData.location,
    url: cleanUrl(jobData.link),
    posted_at: formatDate(jobData.listDate),
    description: jobData.description,
  };
}

const cleanUrl = (url) => {
  if (!url) return '';
  return url.split('?')[0];
}

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toISOString();
}

module.exports = { formatJobData };