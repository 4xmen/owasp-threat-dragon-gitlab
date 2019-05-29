'use strict';
var url = process.env.GITLAB_URL;
var gitlab = require('gitlab').ProjectsBundle;
var threatmodelrepository = {};

threatmodelrepository.repos = async function (page, accessToken, cb) {
	var repo = [];
	var pages = 1;
    var client = new gitlab({url:url, oauthToken:accessToken});
	do {
		let { data, pagination } = await client.Projects.all({ perPage:40, page:pages, showPagination: true }).catch(err=>{
			 return;
		});
		data.forEach(item => {
			repo.push(item);
		});
		pages = pagination['next'];
	}while (pages);
	cb(repo);

};

threatmodelrepository.branches = function (repoInfo, accessToken, cb) {

    var client = new gitlab({url:url, oauthToken:accessToken});
    var params = {
        projectId: getRepoFullName(repoInfo)
    }
    let branches = client.Branches.all(params.projectId)
	.then((branches) => {
		cb(branches)
	}).catch(cb);
};

threatmodelrepository.models = function (branchInfo, accessToken, cb) {

    var client = new gitlab({url:url, oauthToken:accessToken});
    let rep_tree = client.Repositories.tree(getRepoFullName(branchInfo),{path: 'ThreatDragonModels/',ref:branchInfo.branch})
	.then((rep_tree) => {
		cb(rep_tree)
	}).catch(cb);
};

threatmodelrepository.model = function (modelInfo, accessToken, cb) {

    var path = getModelPath(modelInfo);
    var client = new gitlab({url:url, oauthToken:accessToken});
    let files = client.RepositoryFiles.show(getRepoFullName(modelInfo),getModelPath(modelInfo),modelInfo.branch)
	.then((files) => {
		cb(files)
	}).catch(cb);
};

threatmodelrepository.create = function (modelInfo, accessToken, cb) {

    var path = getModelPath(modelInfo);
    var client = new gitlab({url:url, oauthToken:accessToken});
    var message = 'Created by OWASP Threat Dragon';
    var content = getModelContent(modelInfo);
	let created = client.RepositoryFiles.create(getRepoFullName(modelInfo),getModelPath(modelInfo),modelInfo.branch,{content: content, commit_message: message})
	.then((created) => {
		cb(created)
	}).catch(cb);
};

threatmodelrepository.update = function (modelInfo, accessToken, cb) {
    threatmodelrepository.model(modelInfo, accessToken, function (content) {
        if(content){
            var path = getModelPath(modelInfo);
            var client = new gitlab({url:url,oauthToken:accessToken});
            var message = 'Updated by OWASP Threat Dragon';
            var newContent = getModelContent(modelInfo);         
			let edited = client.RepositoryFiles.edit(getRepoFullName(modelInfo), getModelPath(modelInfo),modelInfo.branch,{content: newContent, commit_message: message })
			.then ((edited) => {
				cb(edited)
			}).catch(cb);
        }
        else{
            console.log('err');
        }
    });
};

threatmodelrepository.deleteModel = function (modelInfo, accessToken, cb) {

    threatmodelrepository.model(modelInfo, accessToken, function (content) {
        if (content) {
            var path = getModelPath(modelInfo);
            var client = new gitlab({url:url,oauthToken:accessToken});
            var message = 'Deleted by OWASP Threat Dragon';
			let removed = client.RepositoryFiles.remove(getRepoFullName(modelInfo), getModelPath(modelInfo), modelInfo.branch, {commit_message: message})
			.then ((removed) => {
				cb(removed)
			}).catch(cb);
        }else{
            console.log('err')
        }
    });
};


//private functions

function getRepoFullName(info) {
    return info.organisation + '/' + info.repo;
}

function getModelPath(modelInfo) {
    return 'ThreatDragonModels/' + modelInfo.model + '/' + modelInfo.model + '.json';
}

function getModelContent(modelInfo) {
    return JSON.stringify(modelInfo.body, null, '  ');
}

module.exports = threatmodelrepository;