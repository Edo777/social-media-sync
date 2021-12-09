from ...abstraction.removers.base_remover import BaseRemover
from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

# command: delete_ad
class ExecuteCommand(BaseCommand):
    # DELETE AD GROUP AD
    def __delete_ad(self):
        ad_id = self.get_argument("adId")
        ad_group_id = self.get_argument("adGroupId")

        ids_merge = str(ad_group_id) + "~" + str(ad_id)
        resource_name = self.get_resource_by_id("adGroupAds", ids_merge)

        # Remover instance
        remover = BaseRemover()

        # Initiate remover
        remover.initiate(self)

        # remove campaign
        result = remover.remove(
            resource_name=resource_name, resource_type="ad_group_ad")
        return result

    # start execution
    @override_method
    def start_execution(self):
        result = self.__delete_ad()

        return result
