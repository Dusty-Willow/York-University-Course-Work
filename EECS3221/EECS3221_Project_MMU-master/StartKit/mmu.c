// #include <stdio.h>
// #include <stdlib.h>
// #include <string.h>
// #include <errno.h>
// #include <time.h>

// const int pageSize = 256;
// const int virMemSize = 256;
// const int physMemSize = 128;
// const int tlb_size = 16;

// int main(int argc, char *argv[])
// {
//     int physMem[physMemSize];
//     int virMem[virMemSize][2];
//     int tlb[tlb_size][2];
//     int i, j, k = 0;

//     while (i < virMemSize)
//     {
//         virMem[i][0] = (i > physMemSize - 1)? - 1 : i;
//         virMem[i][1] = (i > physMemSize - 1)? - 1 : physMemSize - i;

//         i++;
//     }

//     while (j < physMemSize)
//     {
//         physMem[j] = j;

//         j++;
//     }   
    
//     while (k < tlb_size)
//     {
//         tlb[k][0] = (k > tlb_size - 1)? - 1 : k;
//         tlb[k][1] = (k > tlb_size - 1)? - 1 : tlb_size - k;

//         k++;
//     }

//     // if (argc != 3)
//     // {
//     //     printf("Incorrect Number of Arguments.\n");
//     //     return 1;
//     // }

//     FILE *fp, *fpt;
//     fp = fopen("addresses.txt", "r");
//     fpt = fopen("output256.csv", "w+");

//     char *line = NULL;
//     size_t len = 0;
//     ssize_t read;

//     int pageNumber = 0;
//     int physAddress = 0;
//     int faultCount = 0;
//     int hitCount = 0;
//     double faultRate = 0.0;
//     double hitRate = 0.0;

//     // printf("------------------------------\n");
//     // printf("    Virtual Memory Manager    \n");
//     // printf("------------------------------\n");

//     // printf("Translating Addresses: \n\n");

//     if (fp == NULL)
//         exit(1);

//     while ((read = getline(&line, &len, fp)) != -1)
//     {
//         // printf("Retrieved line of length %zu:\n", read);
//         // printf("%d\n", line);

//         int offset = atoi(line) & 255;
//         int page = atoi(line) & 65535;
//         int pageTableNumber = page >> 8;
//         int tlb_hit = 0;

//         int l = 0;
//         while (l < tlb_size)
//         {
//             if (tlb[l][0] == pageTableNumber)
//             {
//                 tlb_hit = 1;
//                 // printf("TLB HIT\n");
//                 hitCount++;
//                 break;
//             }

//             l++;
//         }

//         if (virMem[pageTableNumber][0] < 0 && !tlb_hit)
//         {
//             faultCount++;
//             srand(time(NULL));
//             int r = rand();

//             int large = 0;
//             int del = 0;

//             int m = 0;
//             while (m < virMemSize)
//             {
//                 if (virMem[m][1] > large)
//                 {
//                     large = virMem[m][1];
//                     del = m;
//                 }

//                 m++;
//             }

//             int tlb_replacement = r % 15;
//             tlb[tlb_replacement][0] = pageTableNumber;
//             tlb[tlb_replacement][1] = virMem[del][0];
//             virMem[pageTableNumber][0] = virMem[del][0];
//             virMem[pageTableNumber][1] = 0;
//             virMem[del][0] = -1;
//             virMem[del][1] = 0;
//         }

//         // if (page < 100)
//         // {
//         //     printf("Virtual Address = %d    \t", page);
//         // }
//         // else if (page < 1000)
//         // {
//         //     printf("Virtual Address = %d   \t", page);
//         // }
//         // else
//         // {
//         // printf("Virtual Address = %d  \t", page);

//         // }

//         physAddress = (physMem[virMem[pageTableNumber][0]] * pageSize) + offset;
//         // printf("Physical Address: %d\n", physAddress);

//         fprintf(fpt, "%d,%d,%d\n", page,physAddress,offset);    

//         pageNumber++;


//         int n = 0;
//         while (n < virMemSize)
//         {
//             virMem[n][1]++;

//             n++;
//         }
//     }
    
//     faultRate = (double) faultCount / 1000 * 100;
//     hitRate = (double) hitCount / 1000 * 100;

//     fprintf(fpt, "Page Faults Rate, %.2f%%,", faultRate);
//     fprintf(fpt, "TLB Hits Rate, %.2f%%,", hitRate);
//     fclose(fpt);

//     free(line);
//     fclose(fp);

//     exit(0);

    

// }


#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <alloca.h>

// function headers
void getPage(int logicaladdress);
int backingStore(int pageNum);
void TLBInsert(int pageNum, int frameNum);

// define filetypes for files
FILE    *addresses;
FILE    *backing_store;
FILE    *fpt256, *fpt128;

#define BUFF_SIZE 10                   // buffer size for reading a line from addresses file
#define ADDRESS_MASK 0xFFFF            // for masking all of logical_address except the address
#define OFFSET_MASK 0xFF               // for masking the offset
#define TLB_SIZE 16                    // 16 entries in the TLB
#define PAGE_TABLE_SIZE 128            // page table of size 2^7
#define PAGE 256                       // upon page fault, read in 256-byte page from BACKING_STORE
#define FRAME_SIZE 256                 // size of each frame


int inputAddress = 0;
int physAddress = 0;
int myOffset = 0;

int TLBEntries = 0;                    // current number of TLB entries
int hits = 0;                          // counter for TLB hits
int faults = 0;                        // counter for page faults
int currentPage = 0;                   // current number of pages
int logical_address;                   // int to store logical address
int TLBpages[TLB_SIZE];                // array to hold page numbers in TLB
int pagesRef[PAGE_TABLE_SIZE];        // array to hold reference bits for page numbers in TLB
int pageTableNumbers[PAGE_TABLE_SIZE]; // array to hold page numbers in page table
char currentAddress[BUFF_SIZE];        // array to store addresses
signed char fromBackingStore[PAGE];    // holds reads from BACKING_STORE
signed char byte;                      // holds value of physical memory at frame number/offset
int physicalMemory[PAGE_TABLE_SIZE][FRAME_SIZE];          // physical memory array of 32,678 bytes (128 frames x 256-byte frame size)


// function to take the logical address and obtain the physical address and byte stored at that address
void getPage(int logical_address){
    
    // initialize frameNum to -1, sentinel value
    int frameNum = -1;
    
    // mask leftmost 16 bits, then shift right 8 bits to extract page number 
    int pageNum = ((logical_address & ADDRESS_MASK)>>8);

    // offset is just the rightmost bits
    int offset = (logical_address & OFFSET_MASK);
    
    // look through TLB
    int i = 0; 
    while(i < TLB_SIZE)
    {
      // if TLB hit
      if(TLBpages[i] == pageNum)
      {   
        // extract frame number
        frameNum = i; 

	// increase number of hits
        hits++;                
      } // end if

      i++;
    } // end for
    
    // if the frame number was not found in the TLB
    if(frameNum == -1)
    {
      int i = 0;   
      while(i < currentPage)
      {
        // if page number found in page table, extract it
        if(pageTableNumbers[i] == pageNum)
	{         
          frameNum = i; 

	  // change reference bit
          pagesRef[i] = 1;
        } // end if

        i++;
      } // end for

      // if frame number is still -1, pageNum has not been found in TLB or page table 
      if(frameNum == -1)
      {                    
        // read from BACKING_STORE.bin
        int count = backingStore(pageNum);       

	// increase the number of page faults
        faults++;                       

	// change frame number to first available frame number
        frameNum = count; 
      } // end if
    } // end if
    
    // insert page number and frame number into TLB
    TLBInsert(pageNum, frameNum); 


    // assign the value of the signed char to byte
    byte = physicalMemory[frameNum][offset]; 
    

    // output the virtual address, physical address and byte of the signed char to the console
    // printf("Virtual address: %d Physical address: %d Value: %d\n", logical_address, (frameNum << 8) | offset, byte);

    inputAddress = logical_address;
    physAddress = (frameNum << 8) | offset;
    myOffset = byte;
} // end getPage


// function to read from backing store
int backingStore(int pageNum)
{

  int counter = 0;

  // position to read from pageNum
  // SEEK_SET reads from beginning of file
  if (fseek(backing_store, pageNum * PAGE, SEEK_SET) != 0) 
  {
    fprintf(stderr, "Error seeking in backing store\n");
  } // end if
 
 
  if (fread(fromBackingStore, sizeof(signed char), PAGE, backing_store) == 0)
  {
    fprintf(stderr, "Error reading from backing store\n");
  } // end if
 
  // boolean for while loop
  int search = 1;
  
  // second chance algorithm
  while(search)
  {
    if(currentPage == PAGE_TABLE_SIZE)
    {
      currentPage = 0;
    } // end if
 
    // if reference bit is 0
    if(pagesRef[currentPage] == 0)
    {
      // replace page
      pageTableNumbers[currentPage] = pageNum;
 
      // set search to false to end loop
      search = 0;
    } // end if
    // else if reference bit is 1
    else
    {
      // set reference bit to 0
      pagesRef[currentPage] = 0;
    } // end else
    currentPage++;
  } // end while
  // load contents into physical memory
  int i = 0;
  while(i < PAGE)
  {
    physicalMemory[currentPage-1][i] = fromBackingStore[i];

    i++;
  } // end for
  counter = currentPage-1;

  return counter;
} // end backingStore

// insert page into TLB
void TLBInsert(int pageNum, int frameNum){
    
    int i = 0;  // search for entry in TLB
    while(i < TLBEntries)
    {
        if(TLBpages[i] == pageNum)
	{
            break; // break if entry found
        } // end if

        i++;
    } // end for
    
    // if the number of entries is equal to the index
    if(i == TLBEntries)
    {
        // if TLB is not full
        if(TLBEntries < TLB_SIZE)
	{   
	    // insert page with FIFO replacement
            TLBpages[TLBEntries] = pageNum;   
        } // end if
	// else, TLB is full
        else
	{  
	    // shift everything over
            int i = 0;
            while(i < TLB_SIZE - 1)
	        {
                TLBpages[i] = TLBpages[i + 1];

                i++;
            } // end for

	    //FIFO replacement
            TLBpages[TLBEntries-1] = pageNum;
        } // end else        
    } // end if
    
    // if the number of entries is not equal to the index
    else
    {
        // move everything over up to the number of entries - 1
        int i = 0;
        while(i < TLBEntries - 1)
	    {     
            TLBpages[i] = TLBpages[i + 1];     
        
            i++;
        } // end for
        
	// if still room in TLB
        if(TLBEntries < TLB_SIZE)
	{               
	    // insert page at the end
            TLBpages[TLBEntries] = pageNum;
        } // end if
	// else if TLB is full
        else
	{ 
	    // place page at number of entries - 1
            TLBpages[TLBEntries-1] = pageNum;
        } // end else
    } // end else

    // if TLB is still not full, increment the number of entries
    if(TLBEntries < TLB_SIZE)
    {                  
        TLBEntries++;
    } // end if    
} // end TLBInsert


// main opens necessary files and calls on getPage for every entry in the addresses file
int main(int argc, char *argv[])
{
    // error checking for arguments
    // if (argc != 3) 
    // {
    //     fprintf(stderr,"Usage: ./a.out [input file]\n");
    //     return -1;
    // } // end if
    
    // set pagesRef array to 0
    int i = 0;
    while(i < 128)
    {
      pagesRef[i] = 0;

      i++;
    } // end for

    // open backing store file
    backing_store = fopen("BACKING_STORE.bin", "rb");
    
    // error checking for opening file
    if (backing_store == NULL) 
    {
        fprintf(stderr, "Error opening BACKING_STORE.bin %s\n","BACKING_STORE.bin");
        return -1;
    } // end if
    
    // open virtual addresses file
    addresses = fopen("addresses.txt", "r");
    
    // error checking for opening file
    if (addresses == NULL) 
    {
        fprintf(stderr, "Error opening addresses.txt %s\n",argv[1]);
        return -1;
    } // end if
    
    // create output file
    fpt256 = fopen("output256.csv", "w+");
    fpt128 = fopen("output128.csv", "w+");
    
    // define number of translated addresses
    int numberOfTranslatedAddresses = 0;


    // read through the input file and output each logical address
    while ( fgets(currentAddress, BUFF_SIZE, addresses) != NULL)
    {
        logical_address = atoi(currentAddress);
        
        // get the physical address and byte stored at that address
        getPage(logical_address);

        fprintf(fpt256, "%d,%d,%d\n", inputAddress,physAddress,myOffset);
        fprintf(fpt128, "%d,%d,%d\n", inputAddress,physAddress,myOffset);
        
        numberOfTranslatedAddresses++;  // increment the number of translated addresses        
    } // end while

    // calculate and print out the stats
    double pfRate = (faults / (double)1000) * 100;
    double TLBRate = (hits / (double)1000) * 100;

    fprintf(fpt256, "Page Faults Rate, %.2f%%\n,", pfRate);
    fprintf(fpt256, "TLB Hits Rate, %.2f%%,", TLBRate);
    fclose(fpt256);

    fprintf(fpt128, "Page Faults Rate, %.2f%%\n,", pfRate);
    fprintf(fpt128, "TLB Hits Rate, %.2f%%,", TLBRate);
    fclose(fpt128);
    
    // printf("Page Faults = %d\n", faults);
    // printf("Page Fault Rate = %.3f\n",pfRate);
    // printf("TLB Hits = %d\n", hits);
    // printf("TLB Hit Rate = %.3f\n", TLBRate);
    
    
    // close files
    fclose(addresses);
    fclose(backing_store);
    
    return 0;
} // end main